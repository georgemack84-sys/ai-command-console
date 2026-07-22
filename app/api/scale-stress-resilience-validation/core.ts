import { getScaleStressResilienceValidationBundle, runScaleStressResilienceValidation, validateScaleStressResilienceValidation } from "@/services/scale-stress-resilience-validation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ScaleStressResilienceInput, ScaleStressResilienceResult } from "@/types/scale-stress-resilience-validation";

export async function requireScaleStressResilienceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ScaleStressResilienceInput { return body as ScaleStressResilienceInput; }
function resultFromBody(body: Record<string, unknown>): ScaleStressResilienceResult { return (body.result as ScaleStressResilienceResult | undefined) ?? runScaleStressResilienceValidation(inputFromBody(body)); }

export function contractResponse() { return getScaleStressResilienceValidationBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runScaleStressResilienceValidation(); }
export async function recordRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScaleStressResilienceValidation(); return { validation_record: result.validation_record }; }
export async function workloadsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScaleStressResilienceValidation(); return { workloads: result.workloads }; }
export async function stressRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScaleStressResilienceValidation(); return { stress: result.stress, recovery: result.recovery }; }
export async function resilienceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScaleStressResilienceValidation(); return { resilience_score: result.validation_record.resilience_score, recovery: result.recovery }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScaleStressResilienceValidation(); return { replay: result.replay, replay_hash: result.replay_hash }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScaleStressResilienceValidation(); return { evidence_ledger: result.evidence_ledger }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScaleStressResilienceValidation(); return { governance: result.governance }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScaleStressResilienceValidation(); return { certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateScaleStressResilienceValidation(resultFromBody(await readBody(request))); }
