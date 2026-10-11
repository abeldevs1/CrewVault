import assert from "node:assert";
import { AIService, AIQuestionSchema, AISummarySchema } from "../src/lib/ai/client";

export async function runAIStudyPacksTests() {
  console.log("▶ Testing Gemini AI Service & Study Packs...");

  // Test 1: Zod Schema Validation for AI Questions
  const validAIQuestion = {
    question_text: "What is the emergency slide inflation trigger mechanism on the A320?",
    options: [
      "Manual inflation handle pulled after door opened in armed mode",
      "Automatic decompression cabin sensor",
      "Overhead electrical cockpit bus toggle",
      "Landing gear extension circuit breaker"
    ],
    correct_answer: "Manual inflation handle pulled after door opened in armed mode",
    explanation: "Standard evacuation procedure: verify slide inflation or pull manual red inflation handle.",
    difficulty: "Medium" as const,
    topic: "Cabin Doors",
    source_page: 8,
    source_section: "Emergency Door Operations",
  };

  const parsedQ = AIQuestionSchema.parse(validAIQuestion);
  assert.strictEqual(parsedQ.difficulty, "Medium");
  assert.strictEqual(parsedQ.options.length, 4);
  console.log("  ✓ AI Question Zod schema enforces exact 4 options and valid difficulty");

  // Test invalid AI question rejection
  try {
    AIQuestionSchema.parse({
      question_text: "Incomplete question",
      options: ["A", "B"], // Only 2 options, fails validation
      correct_answer: "A",
      explanation: "Test",
      difficulty: "Medium",
      topic: "Doors"
    });
    assert.fail("Should have failed schema validation");
  } catch (err: any) {
    assert.ok(err.name === "ZodError", "Invalid AI output rejected by schema validator");
  }
  console.log("  ✓ Malformed AI output is rejected by schema validator");

  // Test 2: AI Summary Schema
  const validSummary = {
    title: "Q400 Quick Reference Summary",
    summary: "Cockpit lockdown, blowout decompression panels, and attendant PBE location.",
    key_points: ["Verify door deadbolt in LOCK", "Check blowout panel pressure alignment"],
    suggested_subject: "Flight Deck Security",
    suggested_aircraft: "Q400",
    difficulty_level: "Intermediate" as const,
  };
  const parsedSummary = AISummarySchema.parse(validSummary);
  assert.strictEqual(parsedSummary.suggested_aircraft, "Q400");
  console.log("  ✓ AI Summary Zod schema validates key revision bullet points");

  // Test 3: Graceful fallback when GEMINI_API_KEY is not configured
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("  ℹ GEMINI_API_KEY not configured in environment. Testing graceful offline fallback...");
    const fallbackClassify = await AIService.classifyMaterial("Sample Q400 manual text");
    assert.ok(fallbackClassify.subject);
    assert.ok(fallbackClassify.aircraft);

    const fallbackSummary = await AIService.summarizeMaterial("Sample text");
    assert.ok(fallbackSummary.title);
    assert.ok(fallbackSummary.key_points.length > 0);

    const studyPack = await AIService.generateStudyPack("Sample text", "mat_1", "ver_1");
    assert.ok(studyPack.summary);
    assert.ok(studyPack.revision_notes);
    console.log("  ✓ Unconfigured Gemini API key falls back gracefully without crashing unrelated routes");
  } else {
    console.log("  ✓ GEMINI_API_KEY detected. Real API connectivity can be tested with valid quota.");
  }

  // Test 4: AI Result Analyzer logic
  const mockExamSession = {
    total_score: 5,
    score: 4,
    percentage: 80,
    passed: true,
    answers: [
      { topic: "Flight Deck", is_correct: true },
      { topic: "Flight Deck", is_correct: true },
      { topic: "Cabin Doors", is_correct: true },
      { topic: "Emergency Equipment", is_correct: false },
      { topic: "Cabin Doors", is_correct: true },
    ]
  };
  const analysis = await AIService.analyzeExamResult(mockExamSession);
  assert.ok(analysis.strong_areas.length > 0);
  assert.ok(analysis.weak_areas.some(w => w.includes("Emergency Equipment")));
  console.log("  ✓ Adaptive result analyzer correctly detects weak areas and provides recommendations");

  console.log("✅ Gemini AI Service & Study Packs verification passed!\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAIStudyPacksTests().then(() => process.exit(0)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
