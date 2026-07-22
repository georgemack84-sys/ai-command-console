import { getProductionCertificationGateBundle, runProductionCertificationGate, validateProductionCertificationGate } from "@/services/production-certification-gate";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ProductionCertificationGateResult, ProductionCertificationInput } from "@/types/production-certification-gate";

export async function requireProductionCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ProductionCertificationInput { return body as ProductionCertificationInput; }
function resultFromBody(body: Record<string, unknown>): ProductionCertificationGateResult { return (body.result as ProductionCertificationGateResult | undefined) ?? runProductionCertificationGate(inputFromBody(body)); }

export function contractResponse() { return getProductionCertificationGateBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runProductionCertificationGate(); }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionCertificationGate(); return { evidence: result.evidence }; }
export async function validationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionCertificationGate(); return { qualification: result.qualification, compliance: result.compliance, readiness: result.readiness }; }
export async function decisionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionCertificationGate(); return { decision: result.decision, certification_record: result.certification_record }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionCertificationGate(); return { ledger: result.ledger }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionCertificationGate(); return { replay: result.replay }; }
export async function observabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionCertificationGate(); return { observability: result.observability }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionCertificationGate(); return { certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateProductionCertificationGate(resultFromBody(await readBody(request))); }
