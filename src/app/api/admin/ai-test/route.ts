import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { testOpenRouterConnection, getOpenRouterConfig } from "@/lib/ai/openrouter";

export async function GET() {
  try {
    await requireRole(["ADMIN"]);
    const config = getOpenRouterConfig();
    const result = await testOpenRouterConnection();

    return NextResponse.json({
      configured: Boolean(config.apiKey),
      baseUrl: config.baseUrl,
      textModel: config.textModel,
      visionModel: config.visionModel,
      connected: result.ok,
      error: result.error || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unauthorized" }, { status: 401 });
  }
}
