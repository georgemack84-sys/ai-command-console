import { getAssuranceDependencyEvaluationContract, runAssuranceDependencyEvaluation, validateAssuranceDependencyEvaluation } from "@/services/assurance-dependency-evaluation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { AssuranceDependencyInput, AssuranceDependencyResult } from "@/types/assurance-dependency-evaluation";

export async function requireAssuranceDependencyUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): AssuranceDependencyInput { return body as AssuranceDependencyInput; }
function resultFromBody(body: Record<string, unknown>): AssuranceDependencyResult { return (body.result as AssuranceDependencyResult | undefined) ?? runAssuranceDependencyEvaluation(inputFromBody(body)); }

export function contractResponse() { return getAssuranceDependencyEvaluationContract(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runAssuranceDependencyEvaluation(); }
export async function graphRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceDependencyEvaluation(); return { graph: result.graph }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceDependencyEvaluation(); return { registry: result.registry }; }
export async function dependencyValidationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceDependencyEvaluation(); return { validation: result.validation }; }
export async function orderingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceDependencyEvaluation(); return { ordering: result.ordering }; }
export async function planRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceDependencyEvaluation(); return { execution_plan: result.execution_plan }; }
export async function executionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceDependencyEvaluation(); return { execution_records: result.execution_records }; }
export async function propagationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceDependencyEvaluation(); return { propagation: result.propagation }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceDependencyEvaluation(); return { replay: result.replay, replay_hash: result.replay_hash }; }
export async function explainRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceDependencyEvaluation(); return { explainability: result.explainability }; }
export async function integrityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceDependencyEvaluation(); return { integrity: result.integrity, integrity_hash: result.integrity_hash }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceDependencyEvaluation(); return { audit_ledger: result.audit_ledger }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceDependencyEvaluation(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function validateRequest(request: Request) { return validateAssuranceDependencyEvaluation(resultFromBody(await readBody(request))); }
