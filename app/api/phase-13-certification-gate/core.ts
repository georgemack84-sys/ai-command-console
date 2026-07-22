import { getPhase13CertificationGateBundle, runPhase13CertificationGate, validatePhase13CertificationGate } from "@/services/phase-13-certification-gate";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { Phase13CertificationGateResult, Phase13CertificationInput } from "@/types/phase-13-certification-gate";

export async function requirePhase13CertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): Phase13CertificationInput { return body as Phase13CertificationInput; }
function resultFromBody(body: Record<string, unknown>): Phase13CertificationGateResult { return (body.result as Phase13CertificationGateResult | undefined) ?? runPhase13CertificationGate(inputFromBody(body)); }

export function contractResponse() { return getPhase13CertificationGateBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runPhase13CertificationGate(); }
export async function domainsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase13CertificationGate(); return { constitutional_compliance: result.constitutional_compliance, authority_certification: result.authority_certification, assurance_certification: result.assurance_certification, replay_certification: result.replay_certification, governance_certification: result.governance_certification, specification_integrity_certification: result.specification_integrity_certification }; }
export async function testsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase13CertificationGate(); return { tests: result.tests }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase13CertificationGate(); return { evidence_binder: result.evidence_binder }; }
export async function decisionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase13CertificationGate(); return { decision: result.decision, integrity_hash: result.integrity_hash }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase13CertificationGate(); return { certification_ledger: result.certification_ledger }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase13CertificationGate(); return { replay_validator: result.replay_validator, replay_hash: result.replay_hash }; }
export async function reportRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase13CertificationGate(); return { final_report: result.final_report }; }
export async function validateRequest(request: Request) { return validatePhase13CertificationGate(resultFromBody(await readBody(request))); }
