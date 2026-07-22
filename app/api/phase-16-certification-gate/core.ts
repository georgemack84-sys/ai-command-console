import { getPhase16CertificationGateBundle, runPhase16CertificationGate, validatePhase16CertificationGate } from "@/services/phase-16-certification-gate";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { Phase16CertificationInput, Phase16CertificationResult } from "@/types/phase-16-certification-gate";

export async function requirePhase16CertificationGateUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): Phase16CertificationInput { return body as Phase16CertificationInput; }
function resultFromBody(body: Record<string, unknown>): Phase16CertificationResult { return (body.result as Phase16CertificationResult | undefined) ?? runPhase16CertificationGate(inputFromBody(body)); }

export function contractResponse() { return getPhase16CertificationGateBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runPhase16CertificationGate(); }
export async function preconditionsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase16CertificationGate(); return { vp1_report: result.vp1_report, vp2_report: result.vp2_report }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase16CertificationGate(); return { evidence_validator: result.evidence_validator, constitutional_report: result.constitutional_report }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase16CertificationGate(); return { expansion_readiness: result.expansion_readiness }; }
export async function decisionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase16CertificationGate(); return { decision: result.decision, certification_report: result.certification_report }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase16CertificationGate(); return { ledger_entry: result.ledger_entry }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase16CertificationGate(); return { certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validatePhase16CertificationGate(resultFromBody(await readBody(request))); }
