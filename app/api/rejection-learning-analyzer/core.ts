import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  analyzeRejectionLearning,
  getRejectionLearningAnalyzerFoundation,
  replayRejectionLearningAnalysis,
} from "@/services/rejection-learning-analyzer";
import type { RejectionLearningAnalyzerInput, RejectionLearningAnalyzerResult } from "@/types/rejection-learning-analyzer";

export async function requireRejectionLearningAnalyzerUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getRejectionLearningAnalyzerFoundation();
}

export async function analyzeRequest(request: Request) {
  const body = await readBody(request) as RejectionLearningAnalyzerInput;
  return analyzeRejectionLearning(body);
}

export async function classificationRequest(request: Request) {
  const body = await readBody(request) as RejectionLearningAnalyzerInput;
  const result = analyzeRejectionLearning(body);
  return {
    primary_classification: result.primary_classification,
    secondary_factors: result.secondary_factors,
    confidence: result.classification_confidence,
  };
}

export async function failureRequest(request: Request) {
  const body = await readBody(request) as RejectionLearningAnalyzerInput;
  return analyzeRejectionLearning(body).failure_analysis;
}

export async function gapsRequest(request: Request) {
  const body = await readBody(request) as RejectionLearningAnalyzerInput;
  return analyzeRejectionLearning(body).gap_records;
}

export async function opportunitiesRequest(request: Request) {
  const body = await readBody(request) as RejectionLearningAnalyzerInput;
  return analyzeRejectionLearning(body).improvement_opportunities;
}

export async function evidenceRequest(request: Request) {
  const body = await readBody(request) as RejectionLearningAnalyzerInput;
  return analyzeRejectionLearning(body).improvement_evidence;
}

export async function registryRequest(request: Request) {
  const body = await readBody(request) as RejectionLearningAnalyzerInput;
  return analyzeRejectionLearning(body).pattern_registry;
}

export async function auditRequest(request: Request) {
  const body = await readBody(request) as RejectionLearningAnalyzerInput;
  return analyzeRejectionLearning(body).audit_events;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<RejectionLearningAnalyzerResult> & RejectionLearningAnalyzerInput;
  const result = body.explanation && body.audit_events ? body as RejectionLearningAnalyzerResult : analyzeRejectionLearning(body);
  return {
    replay_valid: replayRejectionLearningAnalysis(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    analysis_state: result.analysis_state,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getRejectionLearningAnalyzerFoundation();
  const body = await readBody(request) as RejectionLearningAnalyzerInput;
  const result = analyzeRejectionLearning(body);
  return {
    analysis_state: result.analysis_state,
    primary_classification: result.primary_classification,
    failure_analysis: result.failure_analysis,
    gap_count: result.gap_records.length,
    opportunity_count: result.improvement_opportunities.length,
    failures: result.failures,
    replayable: result.replayable,
    explainable: result.explainable,
    tenant_isolated: result.tenant_isolated,
    evidence_only: result.evidence_only,
    changes_production_behavior: result.changes_production_behavior,
  };
}
