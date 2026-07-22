import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  analyzeConfidenceDegradation,
  getConfidenceDegradationFoundation,
  replayConfidenceDegradation,
} from "@/services/confidence-degradation-analyzer";
import type { ConfidenceDegradationInput, ConfidenceDegradationResult, ConfidenceDegradationType } from "@/types/confidence-degradation-analyzer";

export async function requireConfidenceDegradationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function recordsByType(result: ConfidenceDegradationResult, type: ConfidenceDegradationType) {
  return result.degradation_records.filter((record) => record.degradation_type === type);
}

export function contractResponse() {
  return getConfidenceDegradationFoundation();
}

export async function analyzeRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDegradationInput;
  return analyzeConfidenceDegradation(body);
}

export async function recordsRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDegradationInput;
  return analyzeConfidenceDegradation(body).degradation_records;
}

export async function patternsRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDegradationInput;
  return analyzeConfidenceDegradation(body).failure_patterns;
}

export async function trendsRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDegradationInput;
  return analyzeConfidenceDegradation(body).trend_history;
}

export async function reportRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDegradationInput;
  return analyzeConfidenceDegradation(body).report;
}

export async function registryRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDegradationInput;
  return analyzeConfidenceDegradation(body).registry;
}

export async function inflationRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDegradationInput;
  return recordsByType(analyzeConfidenceDegradation(body), "CONFIDENCE_INFLATION");
}

export async function collapseRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDegradationInput;
  return recordsByType(analyzeConfidenceDegradation(body), "CONFIDENCE_COLLAPSE");
}

export async function oscillationRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDegradationInput;
  return recordsByType(analyzeConfidenceDegradation(body), "CONFIDENCE_OSCILLATION");
}

export async function inconsistencyRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDegradationInput;
  return recordsByType(analyzeConfidenceDegradation(body), "CONFIDENCE_INCONSISTENCY");
}

export async function agingRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDegradationInput;
  return recordsByType(analyzeConfidenceDegradation(body), "AGING_MODEL");
}

export async function evidenceDecayRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDegradationInput;
  return recordsByType(analyzeConfidenceDegradation(body), "EVIDENCE_DECAY");
}

export async function predictionFailuresRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDegradationInput;
  return recordsByType(analyzeConfidenceDegradation(body), "REPEATED_PREDICTION_FAILURE");
}

export async function saturationRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDegradationInput;
  return recordsByType(analyzeConfidenceDegradation(body), "CONFIDENCE_SATURATION");
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<ConfidenceDegradationResult> & ConfidenceDegradationInput;
  const result = body.registry ? body as ConfidenceDegradationResult : analyzeConfidenceDegradation(body);
  return {
    replay_valid: replayConfidenceDegradation(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    replay_refs: result.degradation_records.flatMap((item) => item.replay_refs),
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getConfidenceDegradationFoundation();
  const body = await readBody(request) as ConfidenceDegradationInput;
  const result = analyzeConfidenceDegradation(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    severities: result.degradation_records.map((record) => record.severity),
    detected_patterns: result.report.detected_patterns,
    advisory_only: result.advisory_only,
    updates_confidence_model: result.updates_confidence_model,
    triggers_adaptation: result.triggers_adaptation,
  };
}
