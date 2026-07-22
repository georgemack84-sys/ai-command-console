import { getOutcomeObservationEvaluationContract, runOutcomeObservationEvaluation, validateOutcomeObservationEvaluation } from "@/services/outcome-observation-evaluation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ObservationInput, OutcomeObservationResult } from "@/types/outcome-observation-evaluation";

export async function requireOutcomeObservationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ObservationInput { return body as ObservationInput; }
function resultFromBody(body: Record<string, unknown>): OutcomeObservationResult { return (body.result as OutcomeObservationResult | undefined) ?? runOutcomeObservationEvaluation(inputFromBody(body)); }

export function contractResponse() { return getOutcomeObservationEvaluationContract(); }
export async function createRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runOutcomeObservationEvaluation(); }
export async function windowRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOutcomeObservationEvaluation(); return { window: result.window }; }
export async function collectRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOutcomeObservationEvaluation(); return { evidence: result.evidence }; }
export async function qualifyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOutcomeObservationEvaluation(); return { qualification: result.qualification }; }
export async function closeRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOutcomeObservationEvaluation(); return { closure: result.closure }; }
export async function evaluateRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOutcomeObservationEvaluation(); return { evaluation: result.evaluation, observation: result.observation }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOutcomeObservationEvaluation(); return { missing_late_evidence: result.missing_late_evidence }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOutcomeObservationEvaluation(); return { replay: result.replay, replay_hash: result.replay_hash, valid: validateOutcomeObservationEvaluation(result).valid }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOutcomeObservationEvaluation(); return { ledger: result.ledger }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOutcomeObservationEvaluation(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function validateRequest(request: Request) { return validateOutcomeObservationEvaluation(resultFromBody(await readBody(request))); }
export async function observabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOutcomeObservationEvaluation(); return { observability: result.observability, certification_status: result.certification.status }; }
