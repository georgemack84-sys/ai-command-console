import { NextResponse } from "next/server";
import { getSessionUser } from "@/src/lib/auth";
import { executeTerminalRequest, getTerminalOverview } from "./core";
import { ensureDigestScheduler } from "@/services/digestScheduler";
import { AppError } from "@/src/server/api/errors";
import { apiError } from "@/src/server/api/response";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    ensureDigestScheduler();
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }
    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    return NextResponse.json({
      ok: true,
      overview: await getTerminalOverview(user),
    });
  } catch (error) {
    return apiError(error, "Unable to load console overview.");
  }
}

export async function POST(request: Request) {
  try {
    ensureDigestScheduler();
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }
    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const body = (await request.json()) as { command?: string; action?: string; payload?: Record<string, unknown> };
    const result = await executeTerminalRequest(body, user);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    ensureDigestScheduler();
    const user = await getSessionUser();
    const message = error instanceof Error ? error.message : "Command execution failed.";
    const status = error instanceof AppError ? error.status : 400;
    return NextResponse.json(
      {
        ok: false,
        error: message,
        overview: user
          ? await getTerminalOverview(user)
          : null,
      },
      { status }
    );
  }
}
