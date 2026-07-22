import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  analyzeConfidenceCalibration,
  getConfidenceCalibrationFoundation,
  replayConfidenceCalibration,
} from "@/services/confidence-calibration-engine";
import type { ConfidenceCalibrationInput, ConfidenceCalibrationResult } from "@/types/confidence-calibration-engine";

export async function requireConfidenceCalibrationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getConfidenceCalibrationFoundation();
}

export async function analyzeRequest(request: Request) {
  const body = await readBody(request) as ConfidenceCalibrationInput;
  return analyzeConfidenceCalibration(body);
}

export async function resultsRequest(request: Request) {
  const body = await readBody(request) as ConfidenceCalibrationInput;
  return analyzeConfidenceCalibration(body).calibration_results;
}

export async function scoresRequest(request: Request) {
  const body = await readBody(request) as ConfidenceCalibrationInput;
  return analyzeConfidenceCalibration(body).scores;
}

export async function reportRequest(request: Request) {
  const body = await readBody(request) as ConfidenceCalibrationInput;
  return analyzeConfidenceCalibration(body).report;
}

export async function evidenceRequest(request: Request) {
  const body = await readBody(request) as ConfidenceCalibrationInput;
  return analyzeConfidenceCalibration(body).evidence;
}

export async function biasRequest(request: Request) {
  const body = await readBody(request) as ConfidenceCalibrationInput;
  return analyzeConfidenceCalibration(body).calibration_results.map((result) => ({
    calibration_result_id: result.calibration_result_id,
    confidence_bias: result.confidence_bias,
    confidence_band: result.confidence_band,
  }));
}

export async function varianceRequest(request: Request) {
  const body = await readBody(request) as ConfidenceCalibrationInput;
  return analyzeConfidenceCalibration(body).calibration_results.map((result) => ({
    calibration_result_id: result.calibration_result_id,
    confidence_variance: result.confidence_variance,
    forecast_reliability: result.forecast_reliability,
  }));
}

export async function precisionRequest(request: Request) {
  const body = await readBody(request) as ConfidenceCalibrationInput;
  return analyzeConfidenceCalibration(body).calibration_results.map((result) => ({
    calibration_result_id: result.calibration_result_id,
    prediction_precision: result.prediction_precision,
    uncertainty_alignment: result.uncertainty_alignment,
  }));
}

export async function consistencyRequest(request: Request) {
  const body = await readBody(request) as ConfidenceCalibrationInput;
  return analyzeConfidenceCalibration(body).calibration_results.map((result) => ({
    calibration_result_id: result.calibration_result_id,
    confidence_consistency: result.confidence_consistency,
  }));
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<ConfidenceCalibrationResult> & ConfidenceCalibrationInput;
  const result = body.registry ? body as ConfidenceCalibrationResult : analyzeConfidenceCalibration(body);
  return {
    replay_valid: replayConfidenceCalibration(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    replay_refs: result.calibration_results.flatMap((item) => item.replay_refs),
  };
}

export async function registryRequest(request: Request) {
  const body = await readBody(request) as ConfidenceCalibrationInput;
  return analyzeConfidenceCalibration(body).registry;
}

export async function inspectRequest(request?: Request) {
  if (!request) return getConfidenceCalibrationFoundation();
  const body = await readBody(request) as ConfidenceCalibrationInput;
  const result = analyzeConfidenceCalibration(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    grade: result.scores[0]?.confidence_grade,
    evidence_backed: result.evidence_backed,
    advisory_only: result.advisory_only,
    updates_model: result.updates_model,
  };
}
