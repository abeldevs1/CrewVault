import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { AIService } from "@/lib/ai/client";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { action, text, question_id, material_id, version_id, title, reference, userAnswer } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    if (action === "evaluate_concept") {
      const evaluation = await AIService.evaluateConcept({
        title: title || "Procedure",
        reference: reference || "",
        userAnswer: userAnswer || "",
      });
      return NextResponse.json({ success: true, evaluation });
    }

    // Following actions require authenticated user
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (action === "classify") {
      const result = await AIService.classifyMaterial(text || "");
      return NextResponse.json({ success: true, classification: result });
    }

    if (action === "summarize") {
      const summary = await AIService.summarizeMaterial(text || "");
      return NextResponse.json({ success: true, summary });
    }

    if (action === "extract_questions") {
      const questions = await AIService.extractQuestions(text || "", material_id || "mat", version_id || "v1");
      return NextResponse.json({ success: true, questions });
    }

    return NextResponse.json({ error: "Unknown AI action" }, { status: 400 });
  } catch (err: any) {
    console.error("AI Route Error:", err);
    return NextResponse.json({ error: err.message || "AI operation failed" }, { status: 500 });
  }
}
