import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  certifyOperatorFeedbackIntegration,
  getOperatorFeedbackCertificationGateFoundation,
  replayOperatorFeedbackCertificationGate,
} from "@/services/operator-feedback-certification-gate";
import type { OperatorFeedbackCertificationGateInput, OperatorFeedbackCertificationGateResult } from "@/types/operator-feedback-certification-gate";

export async function requireOperatorFeedbackCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getOperatorFeedbackCertificationGateFoundation();
}

export async function certifyRequest(request: Request) {
  const body = await readBody(request) as OperatorFeedbackCertificationGateInput;
  return certifyOperatorFeedbackIntegration(body);
}

export async function evidencePackageRequest(request: Request) {
  const body = await readBody(request) as OperatorFeedbackCertificationGateInput;
  return certifyOperatorFeedbackIntegration(body).evidence_package;
}

export async function matrixRequest(request: Request) {
  const body = await readBody(request) as OperatorFeedbackCertificationGateInput;
  return certifyOperatorFeedbackIntegration(body).test_matrix;
}

export async function decisionRequest(request: Request) {
  const body = await readBody(request) as OperatorFeedbackCertificationGateInput;
  const result = certifyOperatorFeedbackIntegration(body);
  return {
    outcome: result.outcome,
    failures: result.failures,
    certification_decision_record: result.evidence_package.certification_decision_record,
    progression_authorized: result.outcome === "PASS",
    advisory_only: result.advisory_only,
    changes_production_behavior: result.changes_production_behavior,
  };
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<OperatorFeedbackCertificationGateResult> & OperatorFeedbackCertificationGateInput;
  const result = body.test_matrix && body.evidence_package ? body as OperatorFeedbackCertificationGateResult : certifyOperatorFeedbackIntegration(body);
  return {
    replay_valid: replayOperatorFeedbackCertificationGate(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    outcome: result.outcome,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getOperatorFeedbackCertificationGateFoundation();
  const body = await readBody(request) as OperatorFeedbackCertificationGateInput;
  const result = certifyOperatorFeedbackIntegration(body);
  return {
    outcome: result.outcome,
    failures: result.failures,
    domain_count: result.domain_reports.length,
    matrix_count: result.test_matrix.length,
    replayable: result.replayable,
    explainable: result.explainable,
    tenant_isolated: result.tenant_isolated,
    audit_complete: result.audit_complete,
    advisory_only: result.advisory_only,
    changes_production_behavior: result.changes_production_behavior,
  };
}
