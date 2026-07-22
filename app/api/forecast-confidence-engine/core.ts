import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildForecastConfidenceObservabilitySurface,
  getForecastConfidenceEngineContract,
  replayForecastConfidence,
  runForecastConfidence,
  validateForecastConfidence,
} from "@/services/forecast-confidence-engine";
import type { ForecastConfidenceInput, ForecastConfidenceRepository } from "@/types/forecast-confidence-engine";

export async function requireForecastConfidenceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): ForecastConfidenceInput {
  return body as ForecastConfidenceInput;
}

function repositoryFromBody(body: Record<string, unknown>): ForecastConfidenceRepository {
  return (body.repository as ForecastConfidenceRepository | undefined) ?? runForecastConfidence(inputFromBody(body));
}

export function contractResponse() { return getForecastConfidenceEngineContract(); }
export async function assessRequest(request: Request) { return runForecastConfidence(inputFromBody(await readBody(request))); }
export async function repositoryRequest(request: Request) { return repositoryFromBody(await readBody(request)); }
export async function scoresRequest(request: Request) {
  return repositoryFromBody(await readBody(request)).confidence_records.map((record) => ({
    confidence_id: record.confidence_id,
    prediction_confidence: record.prediction_confidence,
    model_stability: record.model_stability,
    evidence_quality: record.evidence_quality,
    historical_accuracy: record.historical_accuracy,
    replay_consistency: record.replay_consistency,
    governance_certainty: record.governance_certainty,
    overall_forecast_reliability: record.overall_forecast_reliability,
  }));
}
export async function factorsRequest(request: Request) { return repositoryFromBody(await readBody(request)).confidence_records.flatMap((record) => record.supporting_metrics); }
export async function reliabilityRequest(request: Request) {
  return repositoryFromBody(await readBody(request)).confidence_records.map((record) => ({
    confidence_id: record.confidence_id,
    forecast_id: record.forecast_id,
    confidence_level: record.confidence_level,
    reliability_level: record.reliability_level,
    uncertainty_level: record.uncertainty_level,
    overall_forecast_reliability: record.overall_forecast_reliability,
  }));
}
export async function explainRequest(request: Request) {
  return repositoryFromBody(await readBody(request)).confidence_records.map((record) => ({
    confidence_id: record.confidence_id,
    confidence_explanation: record.confidence_explanation,
    assumptions: record.assumptions,
    limitations: record.limitations,
  }));
}
export async function validateRequest(request: Request) { return validateForecastConfidence(repositoryFromBody(await readBody(request))); }
export async function replayRequest(request: Request) { return replayForecastConfidence(repositoryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildForecastConfidenceObservabilitySurface();
  return buildForecastConfidenceObservabilitySurface(repositoryFromBody(await readBody(request)));
}
