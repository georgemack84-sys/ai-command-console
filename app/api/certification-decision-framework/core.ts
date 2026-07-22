import { getCertificationDecisionFrameworkContract, runCertificationDecisionFramework, validateCertificationDecisionFramework } from "@/services/certification-decision-framework";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { CertificationDecisionInput, CertificationDecisionResult } from "@/types/certification-decision-framework";

export async function requireCertificationDecisionUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): CertificationDecisionInput { return body as CertificationDecisionInput; }
function resultFromBody(body: Record<string, unknown>): CertificationDecisionResult { return (body.result as CertificationDecisionResult | undefined) ?? runCertificationDecisionFramework(inputFromBody(body)); }

export function contractResponse() { return getCertificationDecisionFrameworkContract(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runCertificationDecisionFramework(); }
export async function aggregationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCertificationDecisionFramework(); return { aggregation_rules: result.aggregation_rules, decision: result.contract }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCertificationDecisionFramework(); return { evidence_binder: result.evidence_binder }; }
export async function explanationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCertificationDecisionFramework(); return { explanation: result.explanation }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCertificationDecisionFramework(); return { replay: result.replay, replay_hash: result.replay_hash }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCertificationDecisionFramework(); return { ledger: result.ledger }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCertificationDecisionFramework(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function validateRequest(request: Request) { return validateCertificationDecisionFramework(resultFromBody(await readBody(request))); }
