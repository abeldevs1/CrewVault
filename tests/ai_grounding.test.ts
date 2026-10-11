import assert from "node:assert";
import { AIQuestionSchema, AISummarySchema } from "../src/lib/ai/client";

function testAIGroundingSchemas() {
  // 1. Validate AI Question Schema enforcement
  const validQuestion = {
    question_text: "What procedure is used to lock the flight deck door?",
    options: [
      "Press the emergency access code",
      "Rotate manual deadbolt switch to LOCK",
      "Pull cabin pressure release valve",
      "Disconnect flight deck power circuit",
    ],
    correct_answer: "Rotate manual deadbolt switch to LOCK",
    explanation: "Standard operating procedure for Q400 flight deck door.",
    difficulty: "Medium",
    topic: "Flight Deck Security",
    source_page: 12,
    source_section: "Door Locking Mechanism",
  };

  const parsedQ = AIQuestionSchema.parse(validQuestion);
  assert.strictEqual(parsedQ.difficulty, "Medium");
  assert.strictEqual(parsedQ.options.length, 4);

  // 2. Validate AI Summary Schema
  const validSummary = {
    title: "Q400 Flight Deck Procedures",
    summary: "Comprehensive guide on cockpit door security and emergency unlock.",
    key_points: ["Check deadbolt position", "Verify indicator lights"],
    suggested_subject: "Flight Deck Security",
    suggested_aircraft: "Q400",
    difficulty_level: "Intermediate",
  };

  const parsedS = AISummarySchema.parse(validSummary);
  assert.strictEqual(parsedS.suggested_aircraft, "Q400");
}

testAIGroundingSchemas();
