import { NextResponse } from "next/server";
import { emitCivitasEvent } from "@/lib/civitas/eventBus";
import { recordEvidence } from "@/lib/civitas/evidence";
import { LocalNewsDiscoveryAgent, getNewsDiscoveryPrompt } from "@/lib/news/discovery/NewsDiscoveryAgent";
import { newsDiscoveryRequestSchema } from "@/lib/news/discovery/schemas";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = newsDiscoveryRequestSchema.safeParse(Object.fromEntries(url.searchParams));

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid discovery query.",
        issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      },
      { status: 400 },
    );
  }

  const agent = new LocalNewsDiscoveryAgent();
  const event = emitCivitasEvent("HeadlineDiscovered", {
    agent: agent.id,
    category: parsed.data.category,
    limit: parsed.data.limit,
  });
  const response = await agent.execute(parsed.data);
  recordEvidence("News discovery", event, { count: response.count, promptVersion: response.promptVersion });

  return NextResponse.json({
    ...response,
    prompt: getNewsDiscoveryPrompt(),
    civitas: {
      correlationId: event.correlationId,
      replayId: event.replayId,
    },
  });
}
