import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { analyzeRiskSeverityRecalibration, getRiskSeverityRecalibratorFoundation, replayRiskSeverityRecalibration } from "@/services/risk-severity-recalibrator";
import type { RiskSeverityCalibrationType, RiskSeverityRecalibrationInput, RiskSeverityRecalibrationResult } from "@/types/risk-severity-recalibrator";

export async function requireRiskSeverityRecalibratorUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function recordsByType(result: RiskSeverityRecalibrationResult, type: RiskSeverityCalibrationType) {
  return result.records.filter((record) => record.calibration_type === type);
}

export function contractResponse() {
  return getRiskSeverityRecalibratorFoundation();
}

export async function analyzeRequest(request: Request) {
  const body = await readBody(request) as RiskSeverityRecalibrationInput;
  return analyzeRiskSeverityRecalibration(body);
}

export async function recordsRequest(request: Request) {
  const body = await readBody(request) as RiskSeverityRecalibrationInput;
  return analyzeRiskSeverityRecalibration(body).records;
}

export async function calibrationRequest(request: Request) {
  const body = await readBody(request) as RiskSeverityRecalibrationInput;
  return analyzeRiskSeverityRecalibration(body).calibration_analysis;
}

export async function probabilityRequest(request: Request) {
  const body = await readBody(request) as RiskSeverityRecalibrationInput;
  return recordsByType(analyzeRiskSeverityRecalibration(body), "PROBABILITY_ADJUSTMENT");
}

export async function impactRequest(request: Request) {
  const body = await readBody(request) as RiskSeverityRecalibrationInput;
  return recordsByType(analyzeRiskSeverityRecalibration(body), "IMPACT_ADJUSTMENT");
}

export async function thresholdsRequest(request: Request) {
  const body = await readBody(request) as RiskSeverityRecalibrationInput;
  const result = analyzeRiskSeverityRecalibration(body);
  return result.records.filter((record) => record.calibration_type === "ESCALATION_THRESHOLD_REFINEMENT" || record.calibration_type === "ROLLBACK_THRESHOLD_REFINEMENT");
}

export async function escalationRequest(request: Request) {
  const body = await readBody(request) as RiskSeverityRecalibrationInput;
  return recordsByType(analyzeRiskSeverityRecalibration(body), "ESCALATION_THRESHOLD_REFINEMENT");
}

export async function rollbackRequest(request: Request) {
  const body = await readBody(request) as RiskSeverityRecalibrationInput;
  return recordsByType(analyzeRiskSeverityRecalibration(body), "ROLLBACK_THRESHOLD_REFINEMENT");
}

export async function proposalsRequest(request: Request) {
  const body = await readBody(request) as RiskSeverityRecalibrationInput;
  return analyzeRiskSeverityRecalibration(body).proposals;
}

export async function governanceRequest(request: Request) {
  const body = await readBody(request) as RiskSeverityRecalibrationInput;
  const result = analyzeRiskSeverityRecalibration(body);
  return {
    governance_visible: result.governance_visible,
    governance_refs: result.evidence_registry.governance_refs,
    proposal_reviews: result.proposals.map((proposal) => ({
      proposal_id: proposal.proposal_id,
      governance_review_required: proposal.governance_review_required,
      approval_requirements: proposal.approval_requirements,
    })),
  };
}

export async function evidenceRequest(request: Request) {
  const body = await readBody(request) as RiskSeverityRecalibrationInput;
  return analyzeRiskSeverityRecalibration(body).evidence_registry;
}

export async function ledgerRequest(request: Request) {
  const body = await readBody(request) as RiskSeverityRecalibrationInput;
  return analyzeRiskSeverityRecalibration(body).ledger;
}

export async function validationRequest(request: Request) {
  const body = await readBody(request) as RiskSeverityRecalibrationInput;
  return analyzeRiskSeverityRecalibration(body).validation;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<RiskSeverityRecalibrationResult> & RiskSeverityRecalibrationInput;
  const result = body.ledger ? body as RiskSeverityRecalibrationResult : analyzeRiskSeverityRecalibration(body);
  return {
    replay_valid: replayRiskSeverityRecalibration(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    replay_refs: result.records.flatMap((record) => record.replay_refs),
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getRiskSeverityRecalibratorFoundation();
  const body = await readBody(request) as RiskSeverityRecalibrationInput;
  const result = analyzeRiskSeverityRecalibration(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    calibration_type: result.records[0]?.calibration_type,
    calibration_rating: result.calibration_analysis.calibration_rating,
    expected_improvement: result.records[0]?.expected_improvement,
    simulation_ready: result.simulation_ready,
    advisory_only: result.advisory_only,
    mutates_production_severity_models: result.mutates_production_severity_models,
    changes_escalation_thresholds: result.changes_escalation_thresholds,
    changes_rollback_policies: result.changes_rollback_policies,
  };
}
