import { NextResponse } from "next/server";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError } from "@/src/server/api/response";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  applyTerminalOperatorRecoveryAction,
  getTerminalOperatorRecoverySurface,
  previewTerminalOperatorRecoveryAction,
} from "./core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requirePlanId(planId: unknown) {
  const normalized = String(planId || "").trim();
  if (!normalized) {
    throw new AppError(400, "validation_error", "planId is required.");
  }
  return normalized;
}

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }
    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });

    const url = new URL(request.url);
    const planId = requirePlanId(url.searchParams.get("planId"));
    const result = await getTerminalOperatorRecoverySurface(planId, user);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return apiError(error, "Unable to load operator recovery surface.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }
    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });

    const body = await request.json();
    const planId = requirePlanId(body?.planId);
    const action = String(body?.action || "").trim();
    if (!action) {
      throw new AppError(400, "validation_error", "action is required.");
    }

    const payload = body?.payload && typeof body.payload === "object" ? body.payload : {};
    const result = body?.preview
      ? await previewTerminalOperatorRecoveryAction(planId, action, payload, user)
      : await applyTerminalOperatorRecoveryAction(planId, action, payload, user);

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return apiError(error, "Unable to execute operator recovery action.");
  }
}
