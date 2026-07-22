import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  analyzeOverrideLearning,
  getOverrideLearningAnalyzerFoundation,
  replayOverrideLearningAnalysis,
} from "@/services/override-learning-analyzer";
import type { OverrideLearningAnalyzerInput, OverrideLearningAnalyzerResult } from "@/types/override-learning-analyzer";

export async function requireOverrideLearningAnalyzerUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getOverrideLearningAnalyzerFoundation();
}

export async function analyzeRequest(request: Request) {
  const body = await readBody(request) as OverrideLearningAnalyzerInput;
  return analyzeOverrideLearning(body);
}

export async function patternsRequest(request: Request) {
  const body = await readBody(request) as OverrideLearningAnalyzerInput;
  return analyzeOverrideLearning(body).pattern_record;
}

export async function rootCauseRequest(request: Request) {
  const body = await readBody(request) as OverrideLearningAnalyzerInput;
  const result = analyzeOverrideLearning(body);
  return {
    root_cause: result.root_cause,
    contributing_factors: result.contributing_factors,
    confidence: result.root_cause_confidence,
    explanation: result.explanation.root_cause_rationale,
  };
}

export async function frequencyRequest(request: Request) {
  const body = await readBody(request) as OverrideLearningAnalyzerInput;
  return analyzeOverrideLearning(body).frequency_metrics;
}

export async function contextRequest(request: Request) {
  const body = await readBody(request) as OverrideLearningAnalyzerInput;
  return analyzeOverrideLearning(body).context_analysis;
}

export async function evidenceRequest(request: Request) {
  const body = await readBody(request) as OverrideLearningAnalyzerInput;
  return analyzeOverrideLearning(body).improvement_evidence;
}

export async function registryRequest(request: Request) {
  const body = await readBody(request) as OverrideLearningAnalyzerInput;
  return analyzeOverrideLearning(body).registry;
}

export async function auditRequest(request: Request) {
  const body = await readBody(request) as OverrideLearningAnalyzerInput;
  return analyzeOverrideLearning(body).audit_events;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<OverrideLearningAnalyzerResult> & OverrideLearningAnalyzerInput;
  const result = body.explanation && body.audit_events ? body as OverrideLearningAnalyzerResult : analyzeOverrideLearning(body);
  return {
    replay_valid: replayOverrideLearningAnalysis(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    analysis_state: result.analysis_state,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getOverrideLearningAnalyzerFoundation();
  const body = await readBody(request) as OverrideLearningAnalyzerInput;
  const result = analyzeOverrideLearning(body);
  return {
    analysis_state: result.analysis_state,
    root_cause: result.root_cause,
    pattern_type: result.pattern_record?.pattern_type ?? null,
    failures: result.failures,
    replayable: result.replayable,
    explainable: result.explainable,
    tenant_isolated: result.tenant_isolated,
    evidence_only: result.evidence_only,
    changes_production_behavior: result.changes_production_behavior,
  };
}
