import { getPhase17CertificationGateBundle, runPhase17CertificationGate, validatePhase17CertificationGate } from "@/services/phase-17-certification-gate";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { Phase17CertificationGateInput, Phase17CertificationGateResult } from "@/types/phase-17-certification-gate";

export async function requirePhase17CertificationGateUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): Phase17CertificationGateInput { return body as Phase17CertificationGateInput; }
function resultFromBody(body: Record<string, unknown>): Phase17CertificationGateResult { return (body.result as Phase17CertificationGateResult | undefined) ?? runPhase17CertificationGate(inputFromBody(body)); }

export function contractResponse() { return getPhase17CertificationGateBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runPhase17CertificationGate(); }
export async function engineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase17CertificationGate(); return { certification_engine: result.certification_engine, production_scale_framework: result.production_scale_framework }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase17CertificationGate(); return { evidence_aggregator: result.evidence_aggregator, lineage_registry: result.lineage_registry }; }
export async function decisionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase17CertificationGate(); return { decision_service: result.decision_service, dashboard: result.dashboard }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase17CertificationGate(); return { certification_ledger: result.certification_ledger, lineage_registry: result.lineage_registry }; }
export async function approvalRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase17CertificationGate(); return { approval_report: result.approval_report, certification_package: result.certification_package }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase17CertificationGate(); return { certification_package: result.certification_package, certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validatePhase17CertificationGate(resultFromBody(await readBody(request))); }
