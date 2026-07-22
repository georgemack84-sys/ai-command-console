import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  analyzeRiskActualization,
  getRiskActualizationFoundation,
  replayRiskActualization,
} from "@/services/risk-actualization-analyzer";
import type { RiskActualizationInput, RiskActualizationResult } from "@/types/risk-actualization-analyzer";

export async function requireRiskActualizationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getRiskActualizationFoundation();
}

export async function analyzeRequest(request: Request) {
  const body = await readBody(request) as RiskActualizationInput;
  return analyzeRiskActualization(body);
}

export async function recordsRequest(request: Request) {
  const body = await readBody(request) as RiskActualizationInput;
  return analyzeRiskActualization(body).records;
}

export async function comparisonRequest(request: Request) {
  const body = await readBody(request) as RiskActualizationInput;
  return analyzeRiskActualization(body).comparison;
}

export async function severityRequest(request: Request) {
  const body = await readBody(request) as RiskActualizationInput;
  return analyzeRiskActualization(body).records.map((record) => ({
    actualization_id: record.actualization_id,
    predicted_severity: record.predicted_severity,
    actual_severity: record.actual_severity,
    severity_accuracy_score: record.severity_accuracy_score,
  }));
}

export async function probabilityRequest(request: Request) {
  const body = await readBody(request) as RiskActualizationInput;
  return analyzeRiskActualization(body).records.map((record) => ({
    actualization_id: record.actualization_id,
    predicted_probability: record.predicted_probability,
    actual_occurrence: record.actual_occurrence,
    probability_accuracy_score: record.probability_accuracy_score,
  }));
}

export async function escalationRequest(request: Request) {
  const body = await readBody(request) as RiskActualizationInput;
  return analyzeRiskActualization(body).records.map((record) => ({
    actualization_id: record.actualization_id,
    predicted_escalation: record.predicted_escalation,
    actual_escalation: record.actual_escalation,
    escalation_accuracy_score: record.escalation_accuracy_score,
  }));
}

export async function rollbackRequest(request: Request) {
  const body = await readBody(request) as RiskActualizationInput;
  return analyzeRiskActualization(body).records.map((record) => ({
    actualization_id: record.actualization_id,
    rollback_expected: record.rollback_expected,
    rollback_triggered: record.rollback_triggered,
    rollback_accuracy_score: record.rollback_accuracy_score,
  }));
}

export async function governanceRequest(request: Request) {
  const body = await readBody(request) as RiskActualizationInput;
  return analyzeRiskActualization(body).records.map((record) => ({
    actualization_id: record.actualization_id,
    governance_expected: record.governance_expected,
    governance_intervention: record.governance_intervention,
    governance_accuracy_score: record.governance_accuracy_score,
    governance_refs: record.governance_refs,
  }));
}

export async function summaryRequest(request: Request) {
  const body = await readBody(request) as RiskActualizationInput;
  return analyzeRiskActualization(body).summary;
}

export async function evidenceRequest(request: Request) {
  const body = await readBody(request) as RiskActualizationInput;
  return analyzeRiskActualization(body).records.map((record) => ({
    actualization_id: record.actualization_id,
    supporting_evidence_refs: record.supporting_evidence_refs,
    actual_outcome_refs: record.actual_outcome_refs,
    risk_assessment_refs: record.risk_assessment_refs,
  }));
}

export async function ledgerRequest(request: Request) {
  const body = await readBody(request) as RiskActualizationInput;
  return analyzeRiskActualization(body).ledger;
}

export async function validationRequest(request: Request) {
  const body = await readBody(request) as RiskActualizationInput;
  return analyzeRiskActualization(body).validation;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<RiskActualizationResult> & RiskActualizationInput;
  const result = body.ledger ? body as RiskActualizationResult : analyzeRiskActualization(body);
  return {
    replay_valid: replayRiskActualization(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    replay_refs: result.records.flatMap((record) => record.replay_refs),
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getRiskActualizationFoundation();
  const body = await readBody(request) as RiskActualizationInput;
  const result = analyzeRiskActualization(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    classification: result.records[0]?.actualization_classification,
    risk_accuracy_score: result.records[0]?.risk_accuracy_score,
    advisory_only: result.advisory_only,
    observational_only: result.observational_only,
    updates_risk_model: result.updates_risk_model,
  };
}
