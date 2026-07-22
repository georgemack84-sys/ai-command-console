import { getAssuranceEvaluationContractBundle, runAssuranceEvaluationContract, validateAssuranceEvaluationContract } from "@/services/assurance-evaluation-contract";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { AssuranceEvaluationContractResult, AssuranceEvaluationInput } from "@/types/assurance-evaluation-contract";

export async function requireAssuranceEvaluationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): AssuranceEvaluationInput { return body as AssuranceEvaluationInput; }
function resultFromBody(body: Record<string, unknown>): AssuranceEvaluationContractResult { return (body.result as AssuranceEvaluationContractResult | undefined) ?? runAssuranceEvaluationContract(inputFromBody(body)); }

export function contractResponse() { return getAssuranceEvaluationContractBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runAssuranceEvaluationContract(); }
export async function inputsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceEvaluationContract(); return { inputs: result.inputs }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceEvaluationContract(); return { evidence: result.evidence }; }
export async function vocabularyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceEvaluationContract(); return { vocabulary: result.vocabulary }; }
export async function executionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceEvaluationContract(); return { execution: result.execution }; }
export async function explanationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceEvaluationContract(); return { explanation: result.explanation }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceEvaluationContract(); return { ledger: result.ledger }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceEvaluationContract(); return { replay: result.replay, replay_hash: result.replay_hash }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceEvaluationContract(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function validateRequest(request: Request) { return validateAssuranceEvaluationContract(resultFromBody(await readBody(request))); }
