import { getPhase14CertificationGateBundle, runPhase14CertificationGate, validatePhase14CertificationGate } from "@/services/phase14-certification-gate";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { Phase14CertificationInput, Phase14CertificationResult } from "@/types/phase14-certification-gate";

export async function requirePhase14CertificationGateUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): Phase14CertificationInput { return body as Phase14CertificationInput; }
function resultFromBody(body: Record<string, unknown>): Phase14CertificationResult { return (body.result as Phase14CertificationResult | undefined) ?? runPhase14CertificationGate(inputFromBody(body)); }

export function contractResponse() { return getPhase14CertificationGateBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runPhase14CertificationGate(); }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase14CertificationGate(); return { evidence_binder: result.evidence_binder, dependency_certification: result.dependency_certification }; }
export async function decisionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase14CertificationGate(); return { certification_record: result.certification_record, outcome: result.outcome }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase14CertificationGate(); return { lineage_certification: result.lineage_certification, replay_certification: result.replay_certification }; }
export async function reportRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase14CertificationGate(); return { certification_record: result.certification_record, certification_tests: result.certification_tests, failures: result.failures }; }
export async function validateRequest(request: Request) { return validatePhase14CertificationGate(resultFromBody(await readBody(request))); }
