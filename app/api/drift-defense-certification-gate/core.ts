import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  certifyDriftDefense,
  getDriftDefenseCertificationFoundation,
  replayDriftDefenseCertification,
} from "@/services/drift-defense-certification-gate";
import type { DriftDefenseCertificationInput, DriftDefenseCertificationResult } from "@/types/drift-defense-certification-gate";

export async function requireDriftDefenseCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getDriftDefenseCertificationFoundation();
}

export async function certifyRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseCertificationInput;
  return certifyDriftDefense(body);
}

export async function reportRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseCertificationInput;
  return certifyDriftDefense(body).certification_report;
}

export async function detectionCoverageRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseCertificationInput;
  return certifyDriftDefense(body).detection_coverage_report;
}

export async function adversarialDefenseRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseCertificationInput;
  return certifyDriftDefense(body).adversarial_defense_report;
}

export async function containmentRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseCertificationInput;
  return certifyDriftDefense(body).containment_validation_report;
}

export async function replayAuditRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseCertificationInput;
  return certifyDriftDefense(body).replay_integrity_report;
}

export async function governanceSecurityRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseCertificationInput;
  return certifyDriftDefense(body).governance_preservation_report;
}

export async function traceabilityRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseCertificationInput;
  return certifyDriftDefense(body).traceability_matrix;
}

export async function readinessRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseCertificationInput;
  return certifyDriftDefense(body).production_readiness_assessment;
}

export async function recordRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseCertificationInput;
  return certifyDriftDefense(body).certification_record;
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseCertificationInput;
  return certifyDriftDefense(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<DriftDefenseCertificationResult> & DriftDefenseCertificationInput;
  const result = body.certification_report && body.metrics ? body as DriftDefenseCertificationResult : certifyDriftDefense(body);
  return {
    replay_valid: replayDriftDefenseCertification(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    outcome: result.outcome,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getDriftDefenseCertificationFoundation();
  const body = await readBody(request) as DriftDefenseCertificationInput;
  const result = certifyDriftDefense(body);
  return {
    outcome: result.outcome,
    failures: result.failures,
    production_ready: result.metrics.production_ready,
    deterministic: result.deterministic,
    replayable: result.replayable,
    evidence_backed: result.evidence_backed,
    governance_preserved: result.governance_preserved,
    constitutional_preserved: result.constitutional_preserved,
    operator_authority_preserved: result.operator_authority_preserved,
    tenant_isolated: result.tenant_isolated,
    advisory_only: result.advisory_only,
    authorizes_production: result.authorizes_production,
    mutates_production_behavior: result.mutates_production_behavior,
  };
}
