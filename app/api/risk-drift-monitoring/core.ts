import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  getRiskDriftMonitoringFoundation,
  monitorRiskDrift,
  replayRiskDriftMonitoring,
} from "@/services/risk-drift-monitoring";
import type { RiskDriftMonitoringInput, RiskDriftMonitoringResult } from "@/types/risk-drift-monitoring";

export async function requireRiskDriftMonitoringUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getRiskDriftMonitoringFoundation();
}

export async function monitorRequest(request: Request) {
  const body = await readBody(request) as RiskDriftMonitoringInput;
  return monitorRiskDrift(body);
}

export async function baselineRequest(request: Request) {
  const body = await readBody(request) as RiskDriftMonitoringInput;
  return monitorRiskDrift(body).baseline;
}

export async function consistencyRequest(request: Request) {
  const body = await readBody(request) as RiskDriftMonitoringInput;
  return monitorRiskDrift(body).consistency_report;
}

export async function escalationRequest(request: Request) {
  const body = await readBody(request) as RiskDriftMonitoringInput;
  return monitorRiskDrift(body).escalation_report;
}

export async function toleranceRequest(request: Request) {
  const body = await readBody(request) as RiskDriftMonitoringInput;
  return monitorRiskDrift(body).tolerance_report;
}

export async function probabilityRequest(request: Request) {
  const body = await readBody(request) as RiskDriftMonitoringInput;
  return monitorRiskDrift(body).probability_report;
}

export async function reportRequest(request: Request) {
  const body = await readBody(request) as RiskDriftMonitoringInput;
  return monitorRiskDrift(body).drift_report;
}

export async function timelineRequest(request: Request) {
  const body = await readBody(request) as RiskDriftMonitoringInput;
  return monitorRiskDrift(body).escalation_timeline;
}

export async function ledgerRequest(request: Request) {
  const body = await readBody(request) as RiskDriftMonitoringInput;
  return monitorRiskDrift(body).drift_record;
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as RiskDriftMonitoringInput;
  return monitorRiskDrift(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<RiskDriftMonitoringResult> & RiskDriftMonitoringInput;
  const result = body.baseline && body.metrics ? body as RiskDriftMonitoringResult : monitorRiskDrift(body);
  return {
    replay_valid: replayRiskDriftMonitoring(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    status: result.status,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getRiskDriftMonitoringFoundation();
  const body = await readBody(request) as RiskDriftMonitoringInput;
  const result = monitorRiskDrift(body);
  return {
    status: result.status,
    failures: result.failures,
    risk_stability_score: result.metrics.risk_stability_score,
    probability_stability_score: result.metrics.probability_stability_score,
    escalation_variance_score: result.metrics.escalation_variance_score,
    tolerance_variance_score: result.metrics.tolerance_variance_score,
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
    mutates_production_risk: result.mutates_production_risk,
  };
}
