import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  certifyRuntimeHealth,
  evaluateRuntimeHealth,
  getRuntimeHealthStabilityEngineContract,
  publishRuntimeHealth,
  replayRuntimeHealth,
  validateRuntimeHealth,
} from "@/services/runtime-health-stability-engine";
import type { RuntimeHealthInput, RuntimeHealthRecord } from "@/types/runtime-health-stability-engine";

export async function requireRuntimeHealthUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): RuntimeHealthInput {
  return body as RuntimeHealthInput;
}

function recordFromBody(body: Record<string, unknown>): RuntimeHealthRecord {
  return (body.record as RuntimeHealthRecord | undefined) ?? evaluateRuntimeHealth(inputFromBody(body));
}

export function contractResponse() { return getRuntimeHealthStabilityEngineContract(); }
export async function evaluateRequest(request: Request) { return evaluateRuntimeHealth(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateRuntimeHealth(recordFromBody(await readBody(request))); }
export async function timelineRequest(request: Request) { return recordFromBody(await readBody(request)).timeline; }
export async function explanationRequest(request: Request) { return recordFromBody(await readBody(request)).health_explanation; }
export async function replayRequest(request: Request) { return replayRuntimeHealth(recordFromBody(await readBody(request))); }
export async function certifyRequest(request: Request) { return certifyRuntimeHealth(recordFromBody(await readBody(request))); }
export async function publishRequest(request?: Request) {
  if (!request) return publishRuntimeHealth();
  return publishRuntimeHealth(recordFromBody(await readBody(request)));
}
