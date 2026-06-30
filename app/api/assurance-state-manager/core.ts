import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildAssuranceStateThresholds,
  certifyAssuranceState,
  evaluateAssuranceState,
  getAssuranceStateManagerContract,
  publishAssuranceState,
  replayAssuranceState,
  validateAssuranceState,
} from "@/services/assurance-state-manager";
import type { AssuranceStateInput, AssuranceStateRecord } from "@/types/assurance-state-manager";

export async function requireAssuranceStateUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): AssuranceStateInput {
  return body as AssuranceStateInput;
}

function recordFromBody(body: Record<string, unknown>): AssuranceStateRecord {
  return (body.record as AssuranceStateRecord | undefined) ?? evaluateAssuranceState(inputFromBody(body));
}

export function contractResponse() { return getAssuranceStateManagerContract(); }
export async function evaluateRequest(request: Request) { return evaluateAssuranceState(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateAssuranceState(recordFromBody(await readBody(request))); }
export async function thresholdsRequest() { return buildAssuranceStateThresholds(); }
export async function historyRequest(request: Request) { return recordFromBody(await readBody(request)).state_history; }
export async function replayRequest(request: Request) { return replayAssuranceState(recordFromBody(await readBody(request))); }
export async function certifyRequest(request: Request) { return certifyAssuranceState(recordFromBody(await readBody(request))); }
export async function publishRequest(request?: Request) {
  if (!request) return publishAssuranceState();
  return publishAssuranceState(recordFromBody(await readBody(request)));
}
