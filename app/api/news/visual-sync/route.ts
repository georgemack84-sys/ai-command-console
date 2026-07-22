import { NextResponse } from "next/server";
import { getVisualSynchronizationPrompt } from "@/lib/news/visual/VisualSynchronizationAgent";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    agent: "headline-flow-visual-synchronization",
    mode: "local-validated",
    prompt: getVisualSynchronizationPrompt(),
  });
}
