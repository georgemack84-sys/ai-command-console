import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { getRiskAdaptationSimulationFoundation, replayRiskAdaptationSimulation, runRiskAdaptationSimulation } from "@/services/risk-adaptation-simulation";
import type { RiskAdaptationSimulationInput, RiskAdaptationSimulationResult } from "@/types/risk-adaptation-simulation";

export async function requireRiskAdaptationSimulationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getRiskAdaptationSimulationFoundation();
}

export async function runRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationSimulationInput;
  return runRiskAdaptationSimulation(body);
}

export async function recordsRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationSimulationInput;
  return runRiskAdaptationSimulation(body).records;
}

export async function reportRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationSimulationInput;
  return runRiskAdaptationSimulation(body).report;
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationSimulationInput;
  const result = runRiskAdaptationSimulation(body);
  return result.records.map((record) => ({
    simulation_id: record.simulation_id,
    baseline_results: record.baseline_results,
    proposed_results: record.proposed_results,
    improvement_metrics: record.improvement_metrics,
    false_positive_rate: record.false_positive_rate,
    false_negative_rate: record.false_negative_rate,
  }));
}

export async function ledgerRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationSimulationInput;
  return runRiskAdaptationSimulation(body).ledger;
}

export async function validationRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationSimulationInput;
  return runRiskAdaptationSimulation(body).validation;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<RiskAdaptationSimulationResult> & RiskAdaptationSimulationInput;
  const result = body.ledger ? body as RiskAdaptationSimulationResult : runRiskAdaptationSimulation(body);
  return {
    replay_valid: replayRiskAdaptationSimulation(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    replay_refs: result.records.flatMap((record) => record.replay_refs),
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getRiskAdaptationSimulationFoundation();
  const body = await readBody(request) as RiskAdaptationSimulationInput;
  const result = runRiskAdaptationSimulation(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    simulation_type: result.records[0]?.simulation_type,
    scenario_category: result.records[0]?.scenario_category,
    advisory_only: result.advisory_only,
    production_isolated: result.production_isolated,
    mutates_production_risk_models: result.mutates_production_risk_models,
  };
}
