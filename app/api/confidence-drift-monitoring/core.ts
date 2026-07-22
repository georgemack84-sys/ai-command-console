import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  getConfidenceDriftMonitoringFoundation,
  monitorConfidenceDrift,
  replayConfidenceDriftMonitoring,
} from "@/services/confidence-drift-monitoring";
import type { ConfidenceDriftMonitoringInput, ConfidenceDriftMonitoringResult } from "@/types/confidence-drift-monitoring";

export async function requireConfidenceDriftMonitoringUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getConfidenceDriftMonitoringFoundation();
}

export async function monitorRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDriftMonitoringInput;
  return monitorConfidenceDrift(body);
}

export async function baselineRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDriftMonitoringInput;
  return monitorConfidenceDrift(body).baseline;
}

export async function calibrationRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDriftMonitoringInput;
  return monitorConfidenceDrift(body).calibration_report;
}

export async function evidenceRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDriftMonitoringInput;
  return monitorConfidenceDrift(body).evidence_validation;
}

export async function timelineRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDriftMonitoringInput;
  return monitorConfidenceDrift(body).drift_timeline;
}

export async function ledgerRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDriftMonitoringInput;
  return monitorConfidenceDrift(body).drift_record;
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDriftMonitoringInput;
  return monitorConfidenceDrift(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<ConfidenceDriftMonitoringResult> & ConfidenceDriftMonitoringInput;
  const result = body.baseline && body.metrics ? body as ConfidenceDriftMonitoringResult : monitorConfidenceDrift(body);
  return {
    replay_valid: replayConfidenceDriftMonitoring(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    status: result.status,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getConfidenceDriftMonitoringFoundation();
  const body = await readBody(request) as ConfidenceDriftMonitoringInput;
  const result = monitorConfidenceDrift(body);
  return {
    status: result.status,
    failures: result.failures,
    confidence_drift_index: result.metrics.confidence_drift_index,
    calibration_score: result.metrics.calibration_score,
    stability_score: result.metrics.stability_score,
    evidence_alignment_score: result.metrics.evidence_alignment_score,
    severity: result.drift_record.severity,
    recommended_response: result.drift_record.recommended_response,
    containment_required: result.drift_record.containment_required,
    deterministic: result.deterministic,
    replayable: result.replayable,
    explainable: result.explainable,
    evidence_backed: result.evidence_backed,
    governance_preserved: result.governance_preserved,
    constitutional_preserved: result.constitutional_preserved,
    operator_authority_preserved: result.operator_authority_preserved,
    tenant_isolated: result.tenant_isolated,
    advisory_only: result.advisory_only,
    mutates_production_confidence: result.mutates_production_confidence,
  };
}
