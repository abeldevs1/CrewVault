import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { Question } from "@/types";
import { callOpenRouter, getOpenRouterConfig } from "./openrouter";

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// Zod Validation Schemas
export const AIQuestionSchema = z.object({
  question_text: z.string(),
  options: z.array(z.string()).length(4),
  correct_answer: z.string(),
  explanation: z.string().optional().default("Derived from study material"),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).optional().default("Medium"),
  topic: z.string().optional().default("General Aviation"),
  source_page: z.number().optional(),
  source_section: z.string().optional(),
});

export const AISummarySchema = z.object({
  title: z.string(),
  summary: z.string(),
  key_points: z.array(z.string()),
  suggested_subject: z.string().optional().default("Inflight Service & Hospitality"),
  suggested_aircraft: z.string().optional().default("General / All Fleet (Non-Aircraft Specific)"),
  difficulty_level: z.enum(["Beginner", "Intermediate", "Advanced", "All Levels"]).optional().default("Intermediate"),
});

export const AIService = {
  /**
   * Classifies document text into aviation metadata (subject, aircraft, difficulty, tags)
   */
  async classifyMaterial(content: string) {
    const prompt = `Analyze the following cabin crew study material text and return JSON classification metadata:
Text snippet:
${content.substring(0, 3000)}

Return strictly JSON with keys: 
{
  "subject": string (e.g. Inflight Service & Hospitality, Aviation First Aid & Medical, Dangerous Goods Regulations (DGR), Flight Deck & Security Doors, Cabin Doors, Exits & Escape Slides, etc.),
  "aircraft": string (e.g. Boeing 787-9 Dreamliner, Airbus A380-800, Airbus A320neo, General / All Fleet (Non-Aircraft Specific), etc.),
  "difficulty": "Beginner" | "Intermediate" | "Advanced" | "All Levels",
  "tags": string[]
}`;

    const openRouterConfig = getOpenRouterConfig();
    if (openRouterConfig.apiKey) {
      try {
        const text = await callOpenRouter(prompt, undefined, true);
        return JSON.parse(text);
      } catch (orErr) {
        console.warn("OpenRouter classifyMaterial failed, checking Gemini SDK:", orErr);
      }
    }

    const ai = getGeminiClient();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        return JSON.parse(response.text || "{}");
      } catch (e) {
        console.warn("Gemini SDK classify failed:", e);
      }
    }

    return {
      subject: "Inflight Service & Hospitality",
      aircraft: "General / All Fleet (Non-Aircraft Specific)",
      difficulty: "Intermediate",
      tags: ["cabin-crew", "training"],
    };
  },

  /**
   * Generates AI summary & key revision notes for Study Pack
   */
  async summarizeMaterial(text: string) {
    const prompt = `You are an expert aviation instructor for airline cabin crew. Summarize the following aviation training or examination document thoroughly and extract key revision bullet points.

Document Content:
${text.substring(0, 7000)}

Return strictly JSON:
{
  "title": string,
  "summary": string (3 to 5 comprehensive paragraphs highlighting critical safety rules, service procedures, emergency actions, and equipment specs),
  "key_points": string[] (6 to 10 actionable, high-yield revision bullet points that crew must memorize),
  "suggested_subject": string,
  "suggested_aircraft": string,
  "difficulty_level": "Beginner" | "Intermediate" | "Advanced" | "All Levels"
}`;

    const openRouterConfig = getOpenRouterConfig();
    if (openRouterConfig.apiKey) {
      try {
        const rawJson = await callOpenRouter(prompt, undefined, true, 3000);
        const parsed = JSON.parse(rawJson);
        return AISummarySchema.parse(parsed);
      } catch (orErr) {
        console.warn("OpenRouter summarizeMaterial failed:", orErr);
      }
    }

    const ai = getGeminiClient();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        const parsed = JSON.parse(response.text || "{}");
        return AISummarySchema.parse(parsed);
      } catch (e) {
        console.warn("Gemini summarize error:", e);
      }
    }

    // High quality intelligent fallback if AI is offline
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 20);
    const keyPoints = lines.slice(0, 6).map(l => l.replace(/^[-*#\d.]+\s*/, ""));

    return {
      title: "Cabin Crew Revision Summary",
      summary: text.length > 500 ? text.substring(0, 500) + "..." : text,
      key_points: keyPoints.length > 0 ? keyPoints : [
        "Review primary emergency door arming and evacuation commands.",
        "Check pre-flight emergency equipment stowage and pressure gauges.",
        "Ensure standard operating procedures are verified with purser.",
      ],
      suggested_subject: "Inflight Service & Hospitality",
      suggested_aircraft: "General / All Fleet (Non-Aircraft Specific)",
      difficulty_level: "Intermediate" as const,
    };
  },

  /**
   * Extracts and standardizes ALL questions present in uploaded material or pasted text
   */
  async extractQuestions(text: string, materialId: string, versionId: string): Promise<Partial<Question>[]> {
    const { extractQuestionsFromText } = await import("@/lib/parser");
    const regexParsed = extractQuestionsFromText(text);

    const prompt = `You are a certified airline cabin crew examiner. Extract and standardize ALL examination questions present in the document text provided below.
CRITICAL INSTRUCTIONS:
1. Extract EVERY SINGLE question present in the text (e.g. if there are 20 questions, extract ALL 20). Do NOT arbitrarily limit to 5 questions.
2. Every question MUST have exactly 4 clear options (A, B, C, D).
3. If a question is open-ended, true/false, or fill-in-the-blank, convert it into a standard 4-choice Multiple Choice Question with plausible distractors.
4. For the correct answer:
   - If an answer key or indicated answer exists in the text, verify and select that option.
   - If no answer is indicated, determine the scientifically and procedurally correct answer according to airline cabin safety and service standards.
5. Provide a clear explanation citing the safety rule or standard operating procedure.

Document Text:
${text.substring(0, 12000)}

Return strictly JSON with key "questions" containing an array of objects:
{
  "questions": [
    {
      "question_text": string,
      "options": ["A. Option one", "B. Option two", "C. Option three", "D. Option four"],
      "correct_answer": string (e.g. "A. Option one"),
      "explanation": string,
      "difficulty": "Easy" | "Medium" | "Hard",
      "topic": string,
      "source_section": string
    }
  ]
}`;

    const openRouterConfig = getOpenRouterConfig();
    let rawQuestions: any[] = [];

    if (openRouterConfig.apiKey) {
      try {
        const jsonText = await callOpenRouter(prompt, undefined, true, 4000);
        const parsed = JSON.parse(jsonText);
        rawQuestions = Array.isArray(parsed) ? parsed : parsed.questions || [];
      } catch (orErr) {
        console.warn("OpenRouter extractQuestions failed:", orErr);
      }
    }

    if (rawQuestions.length === 0) {
      const ai = getGeminiClient();
      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" },
          });
          const parsed = JSON.parse(response.text || "{}");
          rawQuestions = Array.isArray(parsed) ? parsed : parsed.questions || [];
        } catch (e) {
          console.warn("Gemini extractQuestions error:", e);
        }
      }
    }

    const validQuestions: Partial<Question>[] = [];

    for (const item of rawQuestions) {
      try {
        const validated = AIQuestionSchema.parse(item);
        validQuestions.push({
          question_text: validated.question_text,
          options: validated.options,
          correct_answer: validated.correct_answer,
          explanation: validated.explanation,
          difficulty: validated.difficulty,
          topic: validated.topic,
          source_material_id: materialId,
          source_version_id: versionId,
          source_section: validated.source_section || "Document Text",
          ai_generated: true,
          status: "pending_review",
        });
      } catch (valErr) {
        // Skip malformed question entry
      }
    }

    // If parser found more questions directly from document than AI parsed, prefer exact document questions
    if (regexParsed.length >= validQuestions.length && regexParsed.length > 0) {
      return regexParsed.map((q) => ({
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation || "Extracted directly from study document.",
        difficulty: "Medium",
        topic: q.topic || "Cabin Safety & Regulations",
        source_material_id: materialId,
        source_version_id: versionId,
        source_section: "Extracted Text",
        ai_generated: false,
        status: "pending_review",
      }));
    }

    // If AI succeeded in parsing more questions, return them
    if (validQuestions.length > 0) {
      return validQuestions;
    }

    return [];
  },

  /**
   * Generates a specific number of new practice questions strictly based on a document's content
   */
  async generateQuestionsFromMaterial(
    text: string,
    count: number = 10,
    difficulty: "Easy" | "Medium" | "Hard" = "Medium",
    materialId?: string,
    versionId?: string
  ): Promise<Partial<Question>[]> {
    const prompt = `You are a senior airline cabin crew examiner. Generate exactly ${count} multiple-choice examination questions based STRICTLY on the study material provided below.
Difficulty level: ${difficulty}.
Requirements:
1. Every question must have exactly 4 plausible options (A, B, C, D).
2. The correct answer must be procedurally accurate based on the text.
3. Include an informative explanation citing the relevant safety or service rule.

Study Material:
${text.substring(0, 10000)}

Return strictly JSON with key "questions" containing an array of objects:
{
  "questions": [
    {
      "question_text": string,
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correct_answer": string,
      "explanation": string,
      "difficulty": "${difficulty}",
      "topic": string,
      "source_section": string
    }
  ]
}`;

    const openRouterConfig = getOpenRouterConfig();
    let rawQuestions: any[] = [];

    if (openRouterConfig.apiKey) {
      try {
        const jsonText = await callOpenRouter(prompt, undefined, true, 4000);
        const parsed = JSON.parse(jsonText);
        rawQuestions = Array.isArray(parsed) ? parsed : parsed.questions || [];
      } catch (e) {
        console.warn("OpenRouter generateQuestionsFromMaterial error:", e);
      }
    }

    if (rawQuestions.length === 0) {
      const ai = getGeminiClient();
      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" },
          });
          const parsed = JSON.parse(response.text || "{}");
          rawQuestions = Array.isArray(parsed) ? parsed : parsed.questions || [];
        } catch (e) {
          console.warn("Gemini generateQuestionsFromMaterial error:", e);
        }
      }
    }

    const generated: Partial<Question>[] = [];
    for (const item of rawQuestions) {
      try {
        const val = AIQuestionSchema.parse(item);
        generated.push({
          question_text: val.question_text,
          options: val.options,
          correct_answer: val.correct_answer,
          explanation: val.explanation,
          difficulty: val.difficulty || difficulty,
          topic: val.topic || "General Aviation",
          source_material_id: materialId,
          source_version_id: versionId,
          source_section: val.source_section || "Document Content",
          ai_generated: true,
          status: "approved",
        });
      } catch (err) {}
    }

    if (generated.length === 0) {
      // 1. Check if the text already contains exam questions that can be parsed
      const { extractQuestionsFromText } = await import("@/lib/parser");
      const regexQuestions = extractQuestionsFromText(text);
      if (regexQuestions.length > 0) {
        return regexQuestions.slice(0, count).map((q) => ({
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation || "Extracted directly from study document.",
          difficulty,
          topic: q.topic || "Cabin Safety & Regulations",
          source_material_id: materialId,
          source_version_id: versionId,
          source_section: "Document Text",
          ai_generated: true,
          status: "approved",
        }));
      }

      // 2. Synthesize questions from key procedural paragraphs, steps, and specifications
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 25 && !l.startsWith("#"));

      const synthesized: Partial<Question>[] = [];
      for (let i = 0; i < lines.length && synthesized.length < count; i++) {
        const line = lines[i];

        // Case A: Feature / Spec / Term definition (e.g. "Description : ...", "Preflight Check : ...", "Operation : ...")
        const colonSplit = line.split(/[:\-–—]\s+/);
        if (colonSplit.length >= 2 && colonSplit[0].length < 60) {
          const subjectHeader = colonSplit[0].replace(/^[-*•\d.]+\s*/, "").trim();
          const detail = colonSplit.slice(1).join(" : ").trim();

          synthesized.push({
            question_text: `According to standard procedure, what is the requirement or specification for ${subjectHeader}?`,
            options: [
              `A. ${detail.substring(0, 120)}`,
              `B. Discretionary crew action depending on flight phase`,
              `C. Only required during international long-haul sectors`,
              `D. Prohibited under standard operating procedures`,
            ],
            correct_answer: `A. ${detail.substring(0, 120)}`,
            explanation: `Derived from ${subjectHeader}: ${detail.substring(0, 160)}.`,
            difficulty,
            topic: "Cabin Procedures",
            source_material_id: materialId,
            source_version_id: versionId,
            source_section: subjectHeader,
            ai_generated: true,
            status: "approved",
          });
          continue;
        }

        // Case B: Descriptive procedural sentence
        synthesized.push({
          question_text: `Regarding cabin operations, which of the following statements is procedurally accurate?`,
          options: [
            `A. ${line.substring(0, 120)}`,
            `B. Crew members should bypass this step unless instructed by ground handling`,
            `C. This procedure is optional during domestic regional flights`,
            `D. Action is reserved exclusively for flight deck crew members`,
          ],
          correct_answer: `A. ${line.substring(0, 120)}`,
          explanation: `Procedural text states: ${line.substring(0, 160)}.`,
          difficulty,
          topic: "Cabin Safety & Regulations",
          source_material_id: materialId,
          source_version_id: versionId,
          source_section: "Document Text",
          ai_generated: true,
          status: "approved",
        });
      }

      if (synthesized.length > 0) {
        return synthesized.slice(0, count);
      }
    }

    return generated;
  },

  /**
   * Generates a complete Study Pack workflow response
   */
  async generateStudyPack(text: string, materialId: string, versionId: string) {
    const summary = await this.summarizeMaterial(text);
    const questions = await this.extractQuestions(text, materialId, versionId);

    return {
      summary: summary.summary,
      revision_notes: summary.key_points,
      practice_questions: questions,
    };
  },

  /**
   * Analyzes student exam performance and suggests targeted practice
   */
  async analyzeExamResult(sessionResult: {
    total_score: number;
    score: number;
    percentage: number;
    passed: boolean;
    answers: Array<{ topic: string; is_correct: boolean }>;
  }) {
    const topicStats: Record<string, { correct: number; total: number }> = {};

    for (const ans of sessionResult.answers) {
      const topic = ans.topic || "General Aviation";
      if (!topicStats[topic]) {
        topicStats[topic] = { correct: 0, total: 0 };
      }
      topicStats[topic].total += 1;
      if (ans.is_correct) topicStats[topic].correct += 1;
    }

    const weakTopics: string[] = [];
    const strongTopics: string[] = [];

    for (const [topic, stat] of Object.entries(topicStats)) {
      const pct = (stat.correct / stat.total) * 100;
      if (pct < 75) {
        weakTopics.push(`${topic} (${pct.toFixed(0)}%)`);
      } else {
        strongTopics.push(`${topic} (${pct.toFixed(0)}%)`);
      }
    }

    return {
      overall_feedback: sessionResult.passed
        ? "Excellent performance! You demonstrate solid mastery of the material."
        : "You did not meet the required passing threshold. Focused review recommended.",
      strong_areas: strongTopics.length > 0 ? strongTopics : ["General Aviation"],
      weak_areas: weakTopics.length > 0 ? weakTopics : ["None identified"],
      recommended_action: weakTopics.length > 0
        ? `We recommend taking targeted practice on: ${weakTopics.join(", ")}.`
        : "Ready for advanced mock exams!",
    };
  },

  /**
   * Evaluates a trainee's freeform recall explanation against procedure reference points
   */
  async evaluateConcept({
    title,
    reference,
    userAnswer,
  }: {
    title: string;
    reference: string;
    userAnswer: string;
  }): Promise<{
    scorePercentage: number;
    coveredPoints: string[];
    missingOrInaccuratePoints: string[];
    feedback: string;
  }> {
    const prompt = `You are a Senior Cabin Safety & Service Instructor evaluating a cabin crew trainee's recall in their own words. 
Do NOT require exact word-for-word verbatim matching. As long as the trainee correctly explains the underlying key point, safety action, order, or precaution in their own phrasing, mark it as covered!

Procedure / Topic Title: "${title}"
Required Reference Key Points / Steps:
${reference}

Trainee's Freeform Explanation:
"${userAnswer}"

Evaluate whether all essential key points are adequately explained regardless of exact wording.
Return a valid JSON object matching this structure:
{
  "scorePercentage": 85,
  "coveredPoints": ["Point 1 description", "Point 2 description"],
  "missingOrInaccuratePoints": ["Any critical point missed or incorrectly stated"],
  "feedback": "Constructive 2-sentence encouraging comment for drill/real-life readiness."
}`;

    // 1. Try OpenRouter
    const openRouterConfig = getOpenRouterConfig();
    if (openRouterConfig.apiKey) {
      try {
        const rawJson = await callOpenRouter(prompt, undefined, true);
        if (rawJson) {
          const parsed = JSON.parse(rawJson);
          if (typeof parsed.scorePercentage === "number") {
            return {
              scorePercentage: Math.max(0, Math.min(100, Math.round(parsed.scorePercentage))),
              coveredPoints: Array.isArray(parsed.coveredPoints) ? parsed.coveredPoints : [],
              missingOrInaccuratePoints: Array.isArray(parsed.missingOrInaccuratePoints) ? parsed.missingOrInaccuratePoints : [],
              feedback: parsed.feedback || "Good job reciting the procedure points.",
            };
          }
        }
      } catch (err) {
        console.warn("OpenRouter concept eval failed:", err);
      }
    }

    // 2. Try Gemini direct
    const ai = getGeminiClient();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        const parsed = JSON.parse(response.text || "{}");
        if (typeof parsed.scorePercentage === "number") {
          return {
            scorePercentage: Math.max(0, Math.min(100, Math.round(parsed.scorePercentage))),
            coveredPoints: Array.isArray(parsed.coveredPoints) ? parsed.coveredPoints : [],
            missingOrInaccuratePoints: Array.isArray(parsed.missingOrInaccuratePoints) ? parsed.missingOrInaccuratePoints : [],
            feedback: parsed.feedback || "Good recall practice.",
          };
        }
      } catch (err) {
        console.warn("Gemini concept eval failed:", err);
      }
    }

    // 3. Fallback: Local intelligent concept analyzer
    const lowerAns = userAnswer.toLowerCase();
    const refLines = reference
      .split(/\n|(?:\d+\.)|\|/)
      .map((l) => l.trim().replace(/^[-*•]\s*/, ""))
      .filter((l) => l.length > 5);

    const covered: string[] = [];
    const missing: string[] = [];

    for (const line of refLines) {
      const words = line
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3 && !["with", "from", "that", "this", "have", "been", "must", "when"].includes(w));

      if (words.length === 0) continue;
      const matchCount = words.filter((w) => lowerAns.includes(w)).length;
      const ratio = matchCount / words.length;

      if (ratio >= 0.35 || matchCount >= 2) {
        covered.push(line);
      } else {
        missing.push(line);
      }
    }

    const totalLines = Math.max(1, refLines.length);
    const score = Math.round((covered.length / totalLines) * 100);

    return {
      scorePercentage: Math.max(15, Math.min(100, score)),
      coveredPoints: covered.length > 0 ? covered.slice(0, 5) : ["Basic procedure concepts mentioned"],
      missingOrInaccuratePoints: missing.slice(0, 5),
      feedback:
        score >= 75
          ? "Solid recall demonstration! You covered the primary procedure actions effectively."
          : "Review the remaining steps or equipment specifications to strengthen hands-on readiness.",
    };
  },
};
