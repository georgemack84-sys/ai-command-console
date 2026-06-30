import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  certifyRuntimeConfidence,
  evaluateRuntimeConfidence,
  getRuntimeConfidenceEvaluationEngineContract,
  publishRuntimeConfidence,
  replayRuntimeConfidence,
  validateRuntimeConfidence,
} from "@/services/runtime-confidence-evaluation-engine";
import type { RuntimeConfidenceInput, RuntimeConfidenceRecord } from "@/types/runtime-confidence-evaluation-engine";

export async function requireRuntimeConfidenceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): RuntimeConfidenceInput {
  return body as RuntimeConfidenceInput;
}

function recordFromBody(body: Record<string, unknown>): RuntimeConfidenceRecord {
  return (body.record as RuntimeConfidenceRecord | undefined) ?? evaluateRuntimeConfidence(inputFromBody(body));
}

export function contractResponse() { return getRuntimeConfidenceEvaluationEngineContract(); }
export async function evaluateRequest(request: Request) { return evaluateRuntimeConfidence(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateRuntimeConfidence(recordFromBody(await readBody(request))); }
export async function historyRequest(request: Request) { return recordFromBody(await readBody(request)).history; }
export async function explanationRequest(request: Request) { return recordFromBody(await readBody(request)).confidence_explanation; }
export async function replayRequest(request: Request) { return replayRuntimeConfidence(recordFromBody(await readBody(request))); }
export async function certifyRequest(request: Request) { return certifyRuntimeConfidence(recordFromBody(await readBody(request))); }
export async function publishRequest(request?: Request) {
  if (!request) return publishRuntimeConfidence();
  return publishRuntimeConfidence(recordFromBody(await readBody(request)));
}
