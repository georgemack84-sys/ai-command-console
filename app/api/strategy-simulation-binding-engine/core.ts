import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  bindStrategySimulation,
  getStrategySimulationBindingFoundation,
  replayStrategySimulationBinding,
} from "@/services/strategy-simulation-binding-engine";
import type { StrategySimulationBindingInput, StrategySimulationBindingResult } from "@/types/strategy-simulation-binding-engine";

export async function requireStrategySimulationBindingUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getStrategySimulationBindingFoundation();
}

export async function bindRequest(request: Request) {
  const body = await readBody(request) as StrategySimulationBindingInput;
  return bindStrategySimulation(body);
}

export async function bindingsRequest(request: Request) {
  const body = await readBody(request) as StrategySimulationBindingInput;
  return bindStrategySimulation(body).bindings;
}

export async function scenariosRequest(request: Request) {
  const body = await readBody(request) as StrategySimulationBindingInput;
  return bindStrategySimulation(body).bindings.map((binding) => ({
    simulation_binding_id: binding.simulation_binding_id,
    simulation_scenarios: binding.simulation_scenarios,
    simulation_readiness_status: binding.simulation_readiness_status,
  }));
}

export async function historicalReplayRequest(request: Request) {
  const body = await readBody(request) as StrategySimulationBindingInput;
  return bindStrategySimulation(body).bindings.map((binding) => ({
    simulation_binding_id: binding.simulation_binding_id,
    historical_replay_refs: binding.historical_replay_refs,
    comparative_baseline_refs: binding.comparative_baseline_refs,
  }));
}

export async function counterfactualRequest(request: Request) {
  const body = await readBody(request) as StrategySimulationBindingInput;
  return bindStrategySimulation(body).bindings.map((binding) => ({
    simulation_binding_id: binding.simulation_binding_id,
    counterfactual_refs: binding.counterfactual_refs,
  }));
}

export async function stressRequest(request: Request) {
  const body = await readBody(request) as StrategySimulationBindingInput;
  return bindStrategySimulation(body).bindings.map((binding) => ({
    simulation_binding_id: binding.simulation_binding_id,
    stress_test_refs: binding.stress_test_refs,
  }));
}

export async function comparativeRequest(request: Request) {
  const body = await readBody(request) as StrategySimulationBindingInput;
  return bindStrategySimulation(body).bindings.map((binding) => ({
    simulation_binding_id: binding.simulation_binding_id,
    comparative_baseline_refs: binding.comparative_baseline_refs,
    expected_benefits: binding.expected_benefits,
    expected_risks: binding.expected_risks,
    unintended_consequence_summary: binding.unintended_consequence_summary,
  }));
}

export async function riskRequest(request: Request) {
  const body = await readBody(request) as StrategySimulationBindingInput;
  return bindStrategySimulation(body).bindings.map((binding) => ({
    simulation_binding_id: binding.simulation_binding_id,
    expected_risks: binding.expected_risks,
    unintended_consequence_summary: binding.unintended_consequence_summary,
  }));
}

export async function governanceRequest(request: Request) {
  const body = await readBody(request) as StrategySimulationBindingInput;
  return bindStrategySimulation(body).bindings.map((binding) => ({
    simulation_binding_id: binding.simulation_binding_id,
    governance_validation_refs: binding.governance_validation_refs,
  }));
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<StrategySimulationBindingResult> & StrategySimulationBindingInput;
  const result = body.registry ? body as StrategySimulationBindingResult : bindStrategySimulation(body);
  return {
    replay_valid: replayStrategySimulationBinding(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    replay_refs: result.bindings.flatMap((binding) => binding.replay_refs),
  };
}

export async function registryRequest(request: Request) {
  const body = await readBody(request) as StrategySimulationBindingInput;
  return bindStrategySimulation(body).registry;
}

export async function inspectRequest(request?: Request) {
  if (!request) return getStrategySimulationBindingFoundation();
  const body = await readBody(request) as StrategySimulationBindingInput;
  const result = bindStrategySimulation(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    bindings: result.bindings.length,
    simulation_ready: result.simulation_ready,
    advisory_only: result.advisory_only,
    authorizes_adoption: result.authorizes_adoption,
  };
}
