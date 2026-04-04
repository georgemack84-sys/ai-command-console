import { NextResponse } from "next/server";
import { getSessionUser } from "@/src/lib/auth";
import { buildOverview, handleConsoleRequest } from "./core";
import { ensureDigestScheduler } from "@/services/digestScheduler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  ensureDigestScheduler();
  const user = await getSessionUser();
  return NextResponse.json({
    ok: true,
    overview: buildOverview({
      userId: user?.id || "demo",
      workspaceId: user?.workspaceId || "default",
      userName: user?.name || user?.email || "Demo User",
      userRole: user?.role || "admin",
    }),
  });
}

export async function POST(request: Request) {
  try {
    ensureDigestScheduler();
    const user = await getSessionUser();
    const body = (await request.json()) as { command?: string; action?: string; payload?: Record<string, unknown> };
    const result = await handleConsoleRequest(body, {
      userId: user?.id || "demo",
      workspaceId: user?.workspaceId || "default",
      userName: user?.name || user?.email || "Demo User",
      userRole: user?.role || "admin",
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    ensureDigestScheduler();
    const user = await getSessionUser();
    const message = error instanceof Error ? error.message : "Command execution failed.";
    return NextResponse.json(
      {
        ok: false,
        error: message,
        overview: buildOverview({
          userId: user?.id || "demo",
          workspaceId: user?.workspaceId || "default",
          userName: user?.name || user?.email || "Demo User",
          userRole: user?.role || "admin",
        }),
      },
      { status: 400 }
    );
  }
}
