import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildPredictiveReplaySimulationObservabilitySurface,
  getPredictiveReplaySimulationEngineContract,
  replayPredictiveReplaySimulation,
  runPredictiveReplaySimulation,
  validatePredictiveReplaySimulation,
} from "@/services/predictive-replay-simulation-engine";
import type { PredictiveReplaySimulationInput, PredictiveSimulationLedger } from "@/types/predictive-replay-simulation-engine";

export async function requirePredictiveReplaySimulationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): PredictiveReplaySimulationInput {
  return body as PredictiveReplaySimulationInput;
}

function ledgerFromBody(body: Record<string, unknown>): PredictiveSimulationLedger {
  return (body.ledger as PredictiveSimulationLedger | undefined) ?? runPredictiveReplaySimulation(inputFromBody(body));
}

export function contractResponse() { return getPredictiveReplaySimulationEngineContract(); }
export async function simulateRequest(request: Request) { return runPredictiveReplaySimulation(inputFromBody(await readBody(request))); }
export async function ledgerRequest(request: Request) { return ledgerFromBody(await readBody(request)); }
export async function replayRequest(request: Request) { return replayPredictiveReplaySimulation(ledgerFromBody(await readBody(request))); }
export async function forecastValidationRequest(request: Request) { return ledgerFromBody(await readBody(request)).simulation_records.map((item) => ({ simulation_id: item.simulation_id, forecast_validation: item.forecast_validation })); }
export async function mitigationAnalysisRequest(request: Request) { return ledgerFromBody(await readBody(request)).simulation_records.map((item) => ({ simulation_id: item.simulation_id, mitigation_analysis: item.mitigation_analysis, mitigation_success: item.prediction_accuracy.mitigation_success })); }
export async function accuracyRequest(request: Request) { return ledgerFromBody(await readBody(request)).simulation_records.map((item) => ({ simulation_id: item.simulation_id, prediction_accuracy: item.prediction_accuracy })); }
export async function scenariosRequest(request: Request) { return ledgerFromBody(await readBody(request)).simulation_records.map((item) => ({ simulation_id: item.simulation_id, simulation_type: item.simulation_type, scenario_name: item.scenario_name, scenario_description: item.scenario_description, assumptions: item.assumptions, limitations: item.limitations })); }
export async function explainRequest(request: Request) { return ledgerFromBody(await readBody(request)).simulation_records.map((item) => ({ simulation_id: item.simulation_id, explanation: item.explanation, governance_validation: item.governance_validation, constitutional_validation: item.constitutional_validation })); }
export async function validateRequest(request: Request) { return validatePredictiveReplaySimulation(ledgerFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildPredictiveReplaySimulationObservabilitySurface();
  return buildPredictiveReplaySimulationObservabilitySurface(ledgerFromBody(await readBody(request)));
}
