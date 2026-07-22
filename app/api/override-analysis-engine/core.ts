import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  analyzeOverride,
  computeOverrideAnalysisHash,
  getOverrideAnalysisFoundation,
  replayOverrideAnalysis,
} from "@/services/override-analysis-engine";
import type { OverrideAnalysisInput, OverrideAnalysisResult } from "@/types/override-analysis-engine";

export async function requireOverrideAnalysisUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getOverrideAnalysisContractResponse() {
  return getOverrideAnalysisFoundation();
}

export async function analyzeOverrideRequest(request: Request) {
  const body = await readBody(request) as OverrideAnalysisInput;
  return analyzeOverride(body);
}

export async function classifyOverrideRequest(request: Request) {
  const body = await readBody(request) as OverrideAnalysisInput;
  const result = analyzeOverride(body);
  return {
    primary_override_category: result.override_record.primary_override_category,
    override_categories: result.override_record.override_categories,
    outcome_assessment: result.override_record.override_outcome_assessment,
    pattern: result.trend_record.pattern,
  };
}

export async function compareOverrideRequest(request: Request) {
  const body = await readBody(request) as OverrideAnalysisInput;
  const result = analyzeOverride(body);
  return {
    original_recommendation: result.override_record.original_recommendation,
    modified_recommendation: result.override_record.modified_recommendation,
    recommendation_comparison: result.override_record.recommendation_comparison,
  };
}

export async function outcomeOverrideRequest(request: Request) {
  const body = await readBody(request) as OverrideAnalysisInput;
  const result = analyzeOverride(body);
  return {
    override_outcome_assessment: result.override_record.override_outcome_assessment,
    override_effectiveness_score: result.override_record.override_effectiveness_score,
    mission_impact: result.override_record.mission_impact,
    workflow_impact_score: result.override_record.workflow_impact_score,
  };
}

export async function improvementsOverrideRequest(request: Request) {
  const body = await readBody(request) as OverrideAnalysisInput;
  const result = analyzeOverride(body);
  return {
    improvement_opportunities: result.override_record.improvement_opportunities,
    advisory_only: result.override_record.advisory_only,
    modifies_recommendation_behavior: result.override_record.modifies_recommendation_behavior,
  };
}

export async function validateOverrideRequest(request: Request) {
  const body = await readBody(request) as Partial<OverrideAnalysisResult> & OverrideAnalysisInput;
  const result = body.override_record ? body as OverrideAnalysisResult : analyzeOverride(body);
  return {
    validation: result.validation,
    override_hash: computeOverrideAnalysisHash(result.override_record),
    replay_valid: replayOverrideAnalysis(result),
  };
}

export async function replayOverrideRequest(request: Request) {
  const body = await readBody(request) as Partial<OverrideAnalysisResult> & OverrideAnalysisInput;
  const result = body.override_record ? body as OverrideAnalysisResult : analyzeOverride(body);
  return {
    replay_valid: replayOverrideAnalysis(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
  };
}

export async function inspectOverrideRequest(request?: Request) {
  if (!request) return getOverrideAnalysisFoundation();
  const body = await readBody(request) as OverrideAnalysisInput;
  const result = analyzeOverride(body);
  return {
    status: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    categories: result.override_record.override_categories,
    outcome_assessment: result.override_record.override_outcome_assessment,
    advisory_only: result.advisory_only,
  };
}
