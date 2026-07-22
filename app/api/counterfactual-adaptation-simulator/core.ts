import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  getCounterfactualAdaptationSimulatorFoundation,
  replayCounterfactualSimulation,
  simulateCounterfactualAdaptation,
} from "@/services/counterfactual-adaptation-simulator";
import type { CounterfactualSimulationInput, CounterfactualSimulationResult } from "@/types/counterfactual-adaptation-simulator";

export async function requireCounterfactualSimulatorUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getCounterfactualAdaptationSimulatorFoundation();
}

export async function simulateRequest(request: Request) {
  const body = await readBody(request) as CounterfactualSimulationInput;
  return simulateCounterfactualAdaptation(body);
}

export async function scopesRequest(request: Request) {
  const body = await readBody(request) as CounterfactualSimulationInput;
  return simulateCounterfactualAdaptation(body).supported_scopes;
}

export async function measurementsRequest(request: Request) {
  const body = await readBody(request) as CounterfactualSimulationInput;
  return simulateCounterfactualAdaptation(body).measurements;
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as CounterfactualSimulationInput;
  return simulateCounterfactualAdaptation(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<CounterfactualSimulationResult> & CounterfactualSimulationInput;
  const result = body.simulation_record && body.metrics ? body as CounterfactualSimulationResult : simulateCounterfactualAdaptation(body);
  return {
    replay_valid: replayCounterfactualSimulation(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    outcome: result.outcome,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getCounterfactualAdaptationSimulatorFoundation();
  const body = await readBody(request) as CounterfactualSimulationInput;
  const result = simulateCounterfactualAdaptation(body);
  return {
    outcome: result.outcome,
    failures: result.failures,
    simulation_scopes_evaluated: result.metrics.simulation_scopes_evaluated,
    measurement_dimensions_evaluated: result.metrics.measurement_dimensions_evaluated,
    deterministic: result.deterministic,
    replayable: result.replayable,
    explainable: result.explainable,
    single_variable_preserved: result.single_variable_preserved,
    immutable_history_preserved: result.immutable_history_preserved,
    tenant_isolated: result.tenant_isolated,
    governance_preserved: result.governance_preserved,
    constitutional_behavior_preserved: result.constitutional_behavior_preserved,
    operator_authority_preserved: result.operator_authority_preserved,
    advisory_only: result.advisory_only,
    modifies_historical_truth: result.modifies_historical_truth,
    modifies_production_state: result.modifies_production_state,
    authorizes_implementation: result.authorizes_implementation,
  };
}
