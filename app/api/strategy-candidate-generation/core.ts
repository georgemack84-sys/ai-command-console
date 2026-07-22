import { getStrategyCandidateGenerationContract, runStrategyCandidateGeneration, validateStrategyCandidateGeneration } from "@/services/strategy-candidate-generation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { StrategyCandidateGenerationResult, StrategyCandidateInput } from "@/types/strategy-candidate-generation";

export async function requireStrategyCandidateUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): StrategyCandidateInput { return body as StrategyCandidateInput; }
function resultFromBody(body: Record<string, unknown>): StrategyCandidateGenerationResult { return (body.result as StrategyCandidateGenerationResult | undefined) ?? runStrategyCandidateGeneration(inputFromBody(body)); }

export function contractResponse() { return getStrategyCandidateGenerationContract(); }
export async function generateRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runStrategyCandidateGeneration(); }
export async function eligibilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategyCandidateGeneration(); return { eligibility: result.eligibility, candidates: result.candidates }; }
export async function duplicatesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategyCandidateGeneration(); return { duplicate_detection: result.duplicate_detection }; }
export async function consolidationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategyCandidateGeneration(); return { consolidation: result.consolidation }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategyCandidateGeneration(); return { qualifications: result.qualifications }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategyCandidateGeneration(); return { registry: result.registry }; }
export async function closureRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategyCandidateGeneration(); return { closure: result.closure, ready_for_downstream_evaluation: result.certification.ready_for_downstream_evaluation }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategyCandidateGeneration(); return { lineage_refs: result.consolidation.merged_lineage_refs, equivalence_mappings: result.consolidation.equivalence_mappings }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategyCandidateGeneration(); return { ledger: result.ledger }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategyCandidateGeneration(); return { replay: result.replay, replay_hash: result.replay_hash, valid: validateStrategyCandidateGeneration(result).valid }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategyCandidateGeneration(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function validateRequest(request: Request) { return validateStrategyCandidateGeneration(resultFromBody(await readBody(request))); }
export async function observabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategyCandidateGeneration(); return { observability: result.observability, certification_status: result.certification.status }; }
