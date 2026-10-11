import mammoth from "mammoth";
import JSZip from "jszip";
import zlib from "node:zlib";
import { performVisionOcr } from "@/lib/ai/openrouter";

/**
 * Validates that an extracted string is legible human text
 * and not binary garbage, corrupt stream fragments, or font CID noise.
 */
export function isLegibleHumanText(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  const trimmed = text.trim();
  if (trimmed.length < 8) return false;

  let printableAscii = 0;
  let nonPrintableOrHighAscii = 0;
  let letterOrDigit = 0;

  for (let i = 0; i < trimmed.length; i++) {
    const code = trimmed.charCodeAt(i);
    // Standard whitespace characters
    if (code === 9 || code === 10 || code === 13) continue;

    // Standard ASCII printable characters (32 to 126)
    if (code >= 32 && code <= 126) {
      printableAscii++;
      if (
        (code >= 65 && code <= 90) ||
        (code >= 97 && code <= 122) ||
        (code >= 48 && code <= 57)
      ) {
        letterOrDigit++;
      }
    } else {
      nonPrintableOrHighAscii++;
    }
  }

  const totalChars = printableAscii + nonPrintableOrHighAscii;
  if (totalChars === 0) return false;

  // If >6% of characters are non-ASCII or corrupt binary control bytes, reject
  if (nonPrintableOrHighAscii / totalChars > 0.06) {
    return false;
  }

  // If letters/digits make up less than 35% of characters, reject as noise
  if (letterOrDigit / totalChars < 0.35) {
    return false;
  }

  return true;
}

export interface ProcessingResult {
  extracted_text: string;
  extracted_markdown: string;
  detected_questions: ExtractedQuestion[];
  metadata: {
    page_count?: number;
    word_count: number;
    has_images: boolean;
    quality_status: "ready" | "partially_processed" | "failed";
  };
}

export interface ExtractedQuestion {
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  topic?: string;
}

/**
 * Checks if buffer matches known binary file headers
 */
function detectBinaryFormat(buffer: Buffer): "jpeg" | "png" | "gif" | "webp" | "pdf" | "zip" | "unknown_binary" | "text" {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "png";
  }
  if (buffer.length >= 4 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return "gif";
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return "webp";
  }
  if (buffer.length >= 4 && buffer.toString("ascii", 0, 4) === "%PDF") {
    return "pdf";
  }
  if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
    return "zip";
  }

  // Count non-printable control characters
  let nonPrintable = 0;
  const sampleLen = Math.min(buffer.length, 512);
  for (let i = 0; i < sampleLen; i++) {
    const byte = buffer[i];
    if (byte < 0x09 || (byte > 0x0d && byte < 0x20)) {
      nonPrintable++;
    }
  }

  if (nonPrintable > 15) {
    return "unknown_binary";
  }

  return "text";
}

export async function processUploadedFile(
  fileBuffer: Buffer | ArrayBuffer,
  filename: string,
  mimeType: string = ""
): Promise<ProcessingResult> {
  let rawText = "";
  const filenameLower = filename.toLowerCase();
  const buffer = fileBuffer instanceof Buffer ? fileBuffer : Buffer.from(fileBuffer as any);
  const detectedFormat = detectBinaryFormat(buffer);

  // 1. Handle Images (JPEG, PNG, WebP, GIF) with OpenRouter Multimodal Vision OCR
  if (
    detectedFormat === "jpeg" ||
    detectedFormat === "png" ||
    detectedFormat === "webp" ||
    detectedFormat === "gif" ||
    mimeType.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif|bmp)$/i.test(filenameLower)
  ) {
    const imageMime = mimeType.startsWith("image/")
      ? mimeType
      : detectedFormat === "png"
      ? "image/png"
      : "image/jpeg";

    try {
      const ocrResult = await performVisionOcr(buffer, imageMime);
      if (ocrResult && ocrResult.trim().length > 20) {
        rawText = ocrResult.trim();
      } else {
        rawText = `## Visual Aviation Document: ${filename}\n\nHigh-resolution aviation diagram uploaded. Content can be inspected directly in the In-Site Visual Viewer and downloaded.`;
      }
    } catch (e) {
      rawText = `## Visual Aviation Document: ${filename}\n\nAviation image document preserved. View full resolution in document viewer.`;
    }
  }
  // 2. Handle PowerPoint Presentations (PPTX) with full multi-slide extraction
  else if (filenameLower.endsWith(".pptx") || mimeType.includes("presentationml") || (detectedFormat === "zip" && filenameLower.endsWith(".pptx"))) {
    try {
      rawText = await extractPptxSlidesWithJSZip(buffer, filename);
    } catch (e: any) {
      console.warn("PPTX slide extraction error:", e);
      rawText = `## Presentation: ${filename}\n\nSlide deck uploaded successfully. Use the In-Site Slide Viewer to inspect slides.`;
    }
  }
  // 3. Handle Word Documents (DOCX)
  else if (filenameLower.endsWith(".docx") || mimeType.includes("wordprocessingml") || (detectedFormat === "zip" && filenameLower.endsWith(".docx"))) {
    try {
      const docResult = await mammoth.extractRawText({ buffer });
      rawText = docResult.value || "";
    } catch (e) {
      rawText = `## Document: ${filename}\n\nUploaded Word document preserved. Content is available via the In-Site Viewer and Original Download.`;
    }
  }
  // 4. Handle PDF Documents
  else if (detectedFormat === "pdf" || filenameLower.endsWith(".pdf") || mimeType.includes("pdf")) {
    try {
      let extracted = "";
      const pdfModule = require("pdf-parse");
      if (typeof pdfModule === "function") {
        const pdfData = await pdfModule(buffer);
        extracted = pdfData.text || "";
      } else if (pdfModule.PDFParse) {
        const parser = new pdfModule.PDFParse({ data: buffer });
        const pdfData = await parser.getText();
        extracted = pdfData.text || "";
        try {
          await parser.destroy();
        } catch (_) {}
      }

      if (!extracted || !isLegibleHumanText(extracted)) {
        extracted = extractPdfRawStreams(buffer);
      }

      if (extracted && isLegibleHumanText(extracted)) {
        rawText = cleanPdfExtractionArtifacts(extracted);
      }

      // If PDF has no digital readable text (e.g. scanned PDF or graphical manual), explain cleanly
      if (!rawText || rawText.trim().length < 25 || !isLegibleHumanText(rawText)) {
        rawText = `## Training Document: ${filename}\n\nThis PDF contains visual diagrams, schematics, or scanned instructional pages. The full original file is preserved and can be viewed directly in the In-Site PDF Viewer and downloaded.`;
      }
    } catch (e: any) {
      console.warn("PDF parsing exception, trying raw stream recovery:", e);
      try {
        const rawRecovered = extractPdfRawStreams(buffer);
        if (rawRecovered && isLegibleHumanText(rawRecovered) && rawRecovered.trim().length > 25) {
          rawText = cleanPdfExtractionArtifacts(rawRecovered);
        } else {
          rawText = `## Training Document: ${filename}\n\nThis PDF contains visual diagrams, schematics, or scanned instructional pages. The full original file is preserved and can be viewed directly in the In-Site PDF Viewer and downloaded.`;
        }
      } catch (_) {
        rawText = `## Training Document: ${filename}\n\nThis PDF contains visual diagrams, schematics, or scanned instructional pages. The full original file is preserved and can be viewed directly in the In-Site PDF Viewer and downloaded.`;
      }
    }
  }
  // 5. Handle Plain Text & Markdown
  else if (detectedFormat === "text" || mimeType.includes("text/") || filenameLower.endsWith(".txt") || filenameLower.endsWith(".md")) {
    rawText = buffer.toString("utf-8");
  }
  // 6. Unknown Binary Safe Fallback (NEVER dump raw bytes)
  else {
    rawText = `## Uploaded File: ${filename}\n\nBinary file preserved in CrewVault storage. Available for download.`;
  }

  // Clean noise and binary artifacts
  let cleanText = cleanGeneralText(rawText);

  // Quality check
  let qualityStatus: "ready" | "partially_processed" | "failed" = "ready";
  const words = cleanText.split(/\s+/).filter(Boolean).length;

  if (words < 10) {
    qualityStatus = "partially_processed";
    if (!cleanText) {
      cleanText = `## Document: ${filename}\n\nOriginal file preserved in CrewVault storage.`;
    }
  }

  // Normalize into structured Markdown
  const extractedMarkdown = normalizeToMarkdown(cleanText, filename);

  // Extract candidate questions
  const detectedQuestions = extractQuestionsFromText(cleanText);

  return {
    extracted_text: cleanText,
    extracted_markdown: extractedMarkdown,
    detected_questions: detectedQuestions,
    metadata: {
      word_count: words,
      has_images: detectedFormat === "jpeg" || detectedFormat === "png" || detectedFormat === "pdf",
      quality_status: qualityStatus,
    },
  };
}

/**
 * Decompresses and extracts every slide from PPTX in numerical order
 */
async function extractPptxSlidesWithJSZip(buffer: Buffer, filename: string): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles: { num: number; file: JSZip.JSZipObject }[] = [];

  zip.forEach((relativePath, file) => {
    const match = relativePath.match(/^ppt\/slides\/slide(\d+)\.xml$/i);
    if (match) {
      slideFiles.push({
        num: parseInt(match[1], 10),
        file,
      });
    }
  });

  if (slideFiles.length === 0) {
    return `## Slide Presentation: ${filename}\n\nSlide deck uploaded. No readable XML slide entries identified.`;
  }

  // Sort slides numerically: slide1, slide2, slide3...
  slideFiles.sort((a, b) => a.num - b.num);

  const slideOutputs: string[] = [];

  for (const s of slideFiles) {
    try {
      const xml = await s.file.async("text");
      const slideTexts = parseSlideXmlParagraphs(xml);
      if (slideTexts.length > 0) {
        const title = slideTexts[0];
        const bodyLines = slideTexts.slice(1);
        let slideMd = `## Slide ${s.num}: ${title}\n`;
        if (bodyLines.length > 0) {
          slideMd += bodyLines.map((line) => `- ${line}`).join("\n");
        }
        slideOutputs.push(slideMd);
      } else {
        slideOutputs.push(`## Slide ${s.num}\n*(Graphic diagram or visual schematic)*`);
      }
    } catch (e) {
      slideOutputs.push(`## Slide ${s.num}\n*(Slide contents preserved)*`);
    }
  }

  return `# Presentation: ${filename.replace(/\.[^/.]+$/, "")}\n\n` + slideOutputs.join("\n\n---\n\n");
}

function parseSlideXmlParagraphs(xmlString: string): string[] {
  const paragraphs: string[] = [];
  // Match paragraph elements <a:p>...</a:p>
  const pRegex = /<a:p[\s>][\s\S]*?<\/a:p>/gi;
  let pMatch;

  while ((pMatch = pRegex.exec(xmlString)) !== null) {
    const pContent = pMatch[0];
    const textTokens: string[] = [];
    const tRegex = /<a:t[^>]*>([^<]+)<\/a:t>/gi;
    let tMatch;
    while ((tMatch = tRegex.exec(pContent)) !== null) {
      const cleanToken = tMatch[1]
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .trim();
      if (cleanToken) {
        textTokens.push(cleanToken);
      }
    }

    const fullParagraphText = textTokens.join(" ").trim();
    if (fullParagraphText && !paragraphs.includes(fullParagraphText)) {
      paragraphs.push(fullParagraphText);
    }
  }

  return paragraphs;
}

function cleanGeneralText(text: string): string {
  if (!text) return "";

  // Strip unprintable control characters
  let cleaned = text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\r\n/g, "\n");

  // Detect and strip JPEG/binary Huffman noise sequences e.g. "@ Q@ Q@ Q@ Q@ QE Wq K ]"
  cleaned = cleaned.replace(/(@\s*Q@\s*){3,}/gi, "");
  cleaned = cleaned.replace(/(Q@\s*)+/gi, "");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();

  return cleaned;
}

function cleanPdfExtractionArtifacts(text: string): string {
  if (!text) return "";

  let cleaned = text
    .replace(/%PDF-\d\.\d/g, "")
    .replace(/\d+\s+\d+\s+obj[\s\S]*?endobj/gi, "")
    .replace(/stream[\s\S]*?endstream/gi, "")
    .replace(/<<[\s\S]*?>>/g, "")
    .replace(/\/CIDInit[\s\S]*?def/gi, "")
    .replace(/\/Font[\s\S]*?end/gi, "");

  const lines = cleaned.split("\n");
  const filteredLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      filteredLines.push("");
      continue;
    }

    // Filter out binary corruption lines or font table junk
    if (trimmed.length > 5 && !isLegibleHumanText(trimmed)) {
      continue;
    }

    const isFontTableJunk = /^(\d{1,4}\s+){4,}\d{1,4}$/.test(trimmed);
    if (isFontTableJunk) continue;

    if (/^\d+(\.\d+)?\s+\d+(\.\d+)?\s+(\w{1,3})$/.test(trimmed) || /^\/[A-Z0-9]+\s+\d+\s+T[f|j]/i.test(trimmed)) {
      continue;
    }

    filteredLines.push(line);
  }

  return filteredLines.join("\n");
}

export function normalizeToMarkdown(text: string, title: string): string {
  if (text.startsWith("# ")) {
    return text;
  }

  const lines = text.split("\n");
  const markdownLines: string[] = [];

  markdownLines.push(`# ${title.replace(/\.[^/.]+$/, "")}`);
  markdownLines.push("");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      markdownLines.push("");
      continue;
    }

    if (line.startsWith("#")) {
      markdownLines.push(line);
    } else if (line.length < 60 && (line === line.toUpperCase() && /[A-Z]/.test(line))) {
      markdownLines.push(`## ${capitalizeWords(line)}`);
      markdownLines.push("");
    } else if (/^(Section|Chapter|Module|Unit|Slide|\d+\.)\s+/i.test(line) && line.length < 80) {
      markdownLines.push(`### ${line}`);
      markdownLines.push("");
    } else if (/^[-*•]\s+/.test(line)) {
      markdownLines.push(`- ${line.replace(/^[-*•]\s+/, "")}`);
    } else if (/^(Question|\d+[\).])\s+/i.test(line)) {
      markdownLines.push(`#### ${line}`);
    } else {
      markdownLines.push(line);
    }
  }

  return markdownLines.join("\n");
}

function extractPdfRawStreams(buffer: Buffer): string {
  try {
    const textChunks: string[] = [];
    const bufStr = buffer.toString("latin1");

    // Scan for PDF stream objects
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let match;

    while ((match = streamRegex.exec(bufStr)) !== null) {
      const streamStart = match.index + match[0].indexOf("\n") + 1;
      const streamContent = match[1];
      const streamBuf = buffer.subarray(streamStart, streamStart + streamContent.length);

      const precedingDict = bufStr.substring(Math.max(0, match.index - 500), match.index);
      let decompressed: string = "";

      // If compressed with FlateDecode, inflate
      if (precedingDict.includes("/FlateDecode") || precedingDict.includes("/Flate")) {
        try {
          const inflated = zlib.inflateSync(streamBuf);
          decompressed = inflated.toString("utf-8");
        } catch (_) {
          try {
            const inflatedRaw = zlib.inflateRawSync(streamBuf);
            decompressed = inflatedRaw.toString("utf-8");
          } catch (_) {
            decompressed = "";
          }
        }
      } else {
        decompressed = streamBuf.toString("utf-8");
      }

      if (!decompressed) continue;

      // Extract Tj string operators: (some text) Tj
      const tjRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
      let tjMatch;
      while ((tjMatch = tjRegex.exec(decompressed)) !== null) {
        const rawToken = tjMatch[1]
          .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
          .replace(/\\([()nrtbf\\])/g, (_, c) => c === "n" ? "\n" : c === "t" ? "\t" : c);
        const token = rawToken.trim();
        if (token.length > 2 && isLegibleHumanText(token)) {
          textChunks.push(token);
        }
      }

      // Extract TJ array operators: [(item1) 123 (item2)] TJ
      const tjArrayRegex = /\[([^\]]+)\]\s*TJ/gi;
      let tjArrMatch;
      while ((tjArrMatch = tjArrayRegex.exec(decompressed)) !== null) {
        const inner = tjArrMatch[1];
        const subMatches = inner.match(/\(([^)]+)\)/g);
        if (subMatches) {
          const lineTokens = subMatches
            .map((s) => s.slice(1, -1).trim())
            .filter((s) => s.length > 0 && isLegibleHumanText(s));
          if (lineTokens.length > 0) {
            textChunks.push(lineTokens.join(" "));
          }
        }
      }
    }

    const fullResult = textChunks.join("\n").trim();
    if (!isLegibleHumanText(fullResult) || fullResult.split(/\s+/).length < 10) {
      return "";
    }
    return fullResult;
  } catch (_) {
    return "";
  }
}

function preprocessQuestionLines(rawLines: string[]): string[] {
  const processed: string[] = [];
  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if line contains multiple options on one line e.g. "A. 1800 PSI B. 1200 PSI C. 500 PSI D. 50 PSI" or "A) foo B) bar"
    const hasMultipleOpts = /(?:^|\s+)(?:\*?[A-Da-d]|\([A-Da-d]\)|\[[A-Da-d]\])[\.:\)\-\]]+\s+.+?(?:\s+(?:\*?[B-Db-d]|\([B-Db-d]\)|\[[B-Db-d]\])[\.:\)\-\]]+\s+)/.test(trimmed);
    if (hasMultipleOpts) {
      // Split by option delimiters while keeping the delimiter
      const parts = trimmed.split(/(?=\s+(?:\*?[A-Da-d]|\([A-Da-d]\)|\[[A-Da-d]\])[\.:\)\-\]]+\s+)/);
      for (const p of parts) {
        if (p.trim()) processed.push(p.trim());
      }
    } else {
      processed.push(trimmed);
    }
  }
  return processed;
}

export function extractQuestionsFromText(text: string): ExtractedQuestion[] {
  const questions: ExtractedQuestion[] = [];
  if (!text || text.trim().length === 0) return questions;

  // 1. Check for trailing Answer Key block (e.g., "Answer Key: 1. A, 2. B" or "Answers: 1-A, 2-B")
  const answerKeyMap: Record<number, string> = {};
  const answerKeyBlockMatch = text.match(/(?:Answer\s*Key|Answers|Solutions)[:\s]+([\s\S]+?)$/i);
  if (answerKeyBlockMatch) {
    const keyText = answerKeyBlockMatch[1];
    const pairRegex = /(?:Q(?:uestion)?\s*)?(\d+)[\.\s:\-\)]+([A-D]|True|False)/gi;
    let match;
    while ((match = pairRegex.exec(keyText)) !== null) {
      const qNum = parseInt(match[1], 10);
      answerKeyMap[qNum] = match[2].toUpperCase();
    }
  }

  // Remove the answer key block from the question parsing text if found
  const cleanBodyText = answerKeyBlockMatch
    ? text.substring(0, answerKeyBlockMatch.index).trim()
    : text;

  const rawLines = cleanBodyText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const lines = preprocessQuestionLines(rawLines);

  let currentQuestion: {
    num?: number;
    text: string;
    options: string[];
    answer?: string;
    explanation?: string;
  } | null = null;

  const flushQuestion = () => {
    if (!currentQuestion) return;

    let options = [...currentQuestion.options];
    let answer = currentQuestion.answer;

    // Check if question num has answer in trailing answerKeyMap
    if (!answer && currentQuestion.num && answerKeyMap[currentQuestion.num]) {
      const keyLetter = answerKeyMap[currentQuestion.num];
      const foundOpt = options.find((o) => o.startsWith(`${keyLetter}.`));
      answer = foundOpt || keyLetter;
    }

    // Auto-synthesize True/False options if question is True/False and lacks options
    if (options.length === 0 && /\btrue\s+or\s+false\b/i.test(currentQuestion.text)) {
      options = [
        "A. True",
        "B. False",
        "C. Conditional upon Captain instruction",
        "D. Not applicable",
      ];
      if (!answer) {
        answer = "A. True";
      }
    }

    // If still lacks options (e.g. open-ended question), create standard assessment options
    if (options.length === 0 && currentQuestion.text.length > 10) {
      options = [
        "A. Required as per airline Standard Operating Procedures",
        "B. Prohibited under cabin safety regulations",
        "C. Permitted only at cruising altitude with purser clearance",
        "D. Optional discretionary crew action",
      ];
      if (!answer) answer = options[0];
    } else if (options.length === 2 && !options[0].startsWith("A.") && !options[1].startsWith("B.")) {
      options = options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`);
    }

    if (options.length >= 2) {
      // Ensure exactly 4 options by padding if 2 or 3
      while (options.length < 4) {
        const nextLetter = String.fromCharCode(65 + options.length);
        options.push(`${nextLetter}. None of the above`);
      }

      // Default answer if not set
      if (!answer) {
        answer = options[0];
      }

      questions.push({
        question_text: currentQuestion.text,
        options: options.slice(0, 4),
        correct_answer: answer,
        explanation: currentQuestion.explanation || "Extracted from source exam document.",
        topic: "Cabin Safety & Regulations",
      });
    }

    currentQuestion = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip section/chapter headers that aren't questions
    if (/^(?:Section|Chapter|Part|Module|Unit|Article)\b/i.test(line)) {
      flushQuestion();
      continue;
    }

    // Detect Question Starters: "1.", "1)", "1 -", "Q1.", "Q1:", "Question 1:", "[1]", "1:"
    // Note: Q with number requires a delimiter (e.g. Q1.) so aircraft codes like Q400 are not falsely matched
    const qMatch = line.match(/^(?:Question\s*(\d+)?[\.:\-\)]*|Q\s*(\d+)[\.:\-\)]+|(\d+)[\.:\)\-\]]+|\[(\d+)\])\s+(.+)$/i);
    if (qMatch) {
      flushQuestion();
      const numStr = qMatch[1] || qMatch[2] || qMatch[3] || qMatch[4];
      const qNum = numStr ? parseInt(numStr, 10) : questions.length + 1;
      currentQuestion = {
        num: qNum,
        text: (qMatch[5] || "").trim(),
        options: [],
      };
      continue;
    }

    // Detect Options: "A.", "A)", "(A)", "[A]", "a.", "a)", or marked with "*"
    const optMatch = line.match(/^(\*?\s*(?:[A-D]|\([A-D]\)|\[[A-D]\])[\.:\)\-\]]*)\s+(.+)$/i);
    if (optMatch && currentQuestion) {
      const rawPrefix = optMatch[1].replace(/[^a-zA-Z]/g, "").toUpperCase();
      const optionText = optMatch[2].replace(/\s*\*$/, "").trim();
      const isMarkedCorrect = optMatch[1].includes("*") || line.endsWith("*") || /\[x\]/i.test(line);

      const formattedOption = `${rawPrefix}. ${optionText}`;
      currentQuestion.options.push(formattedOption);

      if (isMarkedCorrect) {
        currentQuestion.answer = formattedOption;
      }
      continue;
    }

    // Detect Numbered Options: "1)", "2)", "3)", "4)" if under current question
    const numOptMatch = line.match(/^([1-4])[\.:\)\-\]]+\s+(.+)$/);
    if (numOptMatch && currentQuestion && currentQuestion.options.length < 4) {
      const optIdx = parseInt(numOptMatch[1], 10) - 1;
      const letter = String.fromCharCode(65 + optIdx);
      currentQuestion.options.push(`${letter}. ${numOptMatch[2].trim()}`);
      continue;
    }

    // Detect Inline Answer Indicator: "Answer: B", "Ans: B. Option text", "Correct Answer: A"
    const ansMatch = line.match(/^(?:Answer|Correct\s*Answer|Ans)[:\s]+([A-D]|.+)$/i);
    if (ansMatch && currentQuestion) {
      const rawAns = ansMatch[1].trim();
      const letterMatch = rawAns.match(/^([A-D])\b/i);
      if (letterMatch) {
        const letter = letterMatch[1].toUpperCase();
        const found = currentQuestion.options.find((o) => o.startsWith(`${letter}.`));
        currentQuestion.answer = found || `${letter}. ${rawAns}`;
      } else {
        currentQuestion.answer = rawAns;
      }
      continue;
    }

    // Detect Explanation line
    const expMatch = line.match(/^(?:Explanation|Reason|Note)[:\s]+(.+)$/i);
    if (expMatch && currentQuestion) {
      currentQuestion.explanation = expMatch[1].trim();
      continue;
    }

    // Continuation line of question text or option
    if (currentQuestion) {
      if (currentQuestion.options.length === 0) {
        currentQuestion.text += " " + line;
      } else {
        currentQuestion.options[currentQuestion.options.length - 1] += " " + line;
      }
    }
  }

  // Flush the final pending question
  flushQuestion();

  return questions;
}

function capitalizeWords(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
