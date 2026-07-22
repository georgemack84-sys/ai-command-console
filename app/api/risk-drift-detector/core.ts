import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { analyzeRiskDrift, getRiskDriftFoundation, replayRiskDrift } from "@/services/risk-drift-detector";
import type { RiskDriftInput, RiskDriftResult, RiskDriftType } from "@/types/risk-drift-detector";

export async function requireRiskDriftUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function recordsByType(result: RiskDriftResult, type: RiskDriftType) {
  return result.records.filter((record) => record.drift_type === type);
}

export function contractResponse() {
  return getRiskDriftFoundation();
}

export async function analyzeRequest(request: Request) {
  const body = await readBody(request) as RiskDriftInput;
  return analyzeRiskDrift(body);
}

export async function recordsRequest(request: Request) {
  const body = await readBody(request) as RiskDriftInput;
  return analyzeRiskDrift(body).records;
}

export async function trendsRequest(request: Request) {
  const body = await readBody(request) as RiskDriftInput;
  return analyzeRiskDrift(body).trend;
}

export async function confidenceRequest(request: Request) {
  const body = await readBody(request) as RiskDriftInput;
  return analyzeRiskDrift(body).records.map((record) => ({
    risk_drift_id: record.risk_drift_id,
    drift_score: record.drift_score,
    confidence_interval: record.confidence_interval,
    classification: record.drift_classification,
  }));
}

export async function timelineRequest(request: Request) {
  const body = await readBody(request) as RiskDriftInput;
  return analyzeRiskDrift(body).timeline;
}

export async function evidenceRequest(request: Request) {
  const body = await readBody(request) as RiskDriftInput;
  return analyzeRiskDrift(body).evidence_registry;
}

export async function ledgerRequest(request: Request) {
  const body = await readBody(request) as RiskDriftInput;
  return analyzeRiskDrift(body).ledger;
}

export async function severityRequest(request: Request) {
  const body = await readBody(request) as RiskDriftInput;
  return recordsByType(analyzeRiskDrift(body), "SEVERITY_DRIFT");
}

export async function probabilityRequest(request: Request) {
  const body = await readBody(request) as RiskDriftInput;
  return recordsByType(analyzeRiskDrift(body), "PROBABILITY_DRIFT");
}

export async function escalationRequest(request: Request) {
  const body = await readBody(request) as RiskDriftInput;
  return recordsByType(analyzeRiskDrift(body), "ESCALATION_DRIFT");
}

export async function governanceRequest(request: Request) {
  const body = await readBody(request) as RiskDriftInput;
  return recordsByType(analyzeRiskDrift(body), "GOVERNANCE_DRIFT");
}

export async function missionRequest(request: Request) {
  const body = await readBody(request) as RiskDriftInput;
  return recordsByType(analyzeRiskDrift(body), "MISSION_TYPE_DRIFT");
}

export async function operatorRequest(request: Request) {
  const body = await readBody(request) as RiskDriftInput;
  return recordsByType(analyzeRiskDrift(body), "OPERATOR_SPECIFIC_DRIFT");
}

export async function tenantRequest(request: Request) {
  const body = await readBody(request) as RiskDriftInput;
  const result = analyzeRiskDrift(body);
  return { tenant_isolated: result.tenant_isolated, records: recordsByType(result, "TENANT_SPECIFIC_DRIFT") };
}

export async function domainRequest(request: Request) {
  const body = await readBody(request) as RiskDriftInput;
  return recordsByType(analyzeRiskDrift(body), "DOMAIN_DRIFT");
}

export async function validationRequest(request: Request) {
  const body = await readBody(request) as RiskDriftInput;
  return analyzeRiskDrift(body).validation;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<RiskDriftResult> & RiskDriftInput;
  const result = body.ledger ? body as RiskDriftResult : analyzeRiskDrift(body);
  return {
    replay_valid: replayRiskDrift(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    replay_refs: result.records.flatMap((record) => record.replay_refs),
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getRiskDriftFoundation();
  const body = await readBody(request) as RiskDriftInput;
  const result = analyzeRiskDrift(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    drift_type: result.records[0]?.drift_type,
    classification: result.records[0]?.drift_classification,
    drift_score: result.records[0]?.drift_score,
    advisory_only: result.advisory_only,
    updates_risk_model: result.updates_risk_model,
    updates_risk_thresholds: result.updates_risk_thresholds,
  };
}
