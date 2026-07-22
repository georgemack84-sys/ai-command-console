import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { analyzeRiskPatternIntelligence, getRiskPatternIntelligenceFoundation, replayRiskPatternIntelligence } from "@/services/risk-pattern-intelligence";
import type { RiskPatternInput, RiskPatternResult } from "@/types/risk-pattern-intelligence";

export async function requireRiskPatternUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getRiskPatternIntelligenceFoundation();
}

export async function analyzeRequest(request: Request) {
  const body = await readBody(request) as RiskPatternInput;
  return analyzeRiskPatternIntelligence(body);
}

export async function patternsRequest(request: Request) {
  const body = await readBody(request) as RiskPatternInput;
  return analyzeRiskPatternIntelligence(body).patterns;
}

export async function classificationsRequest(request: Request) {
  const body = await readBody(request) as RiskPatternInput;
  const result = analyzeRiskPatternIntelligence(body);
  return result.patterns.map((pattern) => ({
    risk_pattern_id: pattern.risk_pattern_id,
    pattern_category: pattern.pattern_category,
    risk_domain: pattern.risk_domain,
    pattern_frequency: pattern.pattern_frequency,
  }));
}

export async function confidenceRequest(request: Request) {
  const body = await readBody(request) as RiskPatternInput;
  return analyzeRiskPatternIntelligence(body).confidence;
}

export async function timelineRequest(request: Request) {
  const body = await readBody(request) as RiskPatternInput;
  return analyzeRiskPatternIntelligence(body).timeline;
}

export async function recommendationsRequest(request: Request) {
  const body = await readBody(request) as RiskPatternInput;
  return analyzeRiskPatternIntelligence(body).recommendations;
}

export async function evidenceRequest(request: Request) {
  const body = await readBody(request) as RiskPatternInput;
  return analyzeRiskPatternIntelligence(body).evidence_registry;
}

export async function ledgerRequest(request: Request) {
  const body = await readBody(request) as RiskPatternInput;
  return analyzeRiskPatternIntelligence(body).ledger;
}

export async function governanceRequest(request: Request) {
  const body = await readBody(request) as RiskPatternInput;
  const result = analyzeRiskPatternIntelligence(body);
  return {
    governance_visible: result.governance_visible,
    governance_refs: result.evidence_registry.governance_decision_refs,
    governance_patterns: result.patterns.filter((pattern) => pattern.risk_domain === "GOVERNANCE_RISK"),
    review_requirements: result.recommendations.map((recommendation) => ({
      recommendation_id: recommendation.recommendation_id,
      governance_review_required: recommendation.governance_review_required,
      operator_review_required: recommendation.operator_review_required,
    })),
  };
}

export async function validationRequest(request: Request) {
  const body = await readBody(request) as RiskPatternInput;
  return analyzeRiskPatternIntelligence(body).validation;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<RiskPatternResult> & RiskPatternInput;
  const result = body.ledger ? body as RiskPatternResult : analyzeRiskPatternIntelligence(body);
  return {
    replay_valid: replayRiskPatternIntelligence(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    replay_refs: result.patterns.flatMap((pattern) => pattern.replay_refs),
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getRiskPatternIntelligenceFoundation();
  const body = await readBody(request) as RiskPatternInput;
  const result = analyzeRiskPatternIntelligence(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    pattern_category: result.patterns[0]?.pattern_category,
    pattern_confidence: result.patterns[0]?.pattern_confidence,
    confidence_band: result.confidence.confidence_band,
    advisory_only: result.advisory_only,
    mutates_production_risk_models: result.mutates_production_risk_models,
    changes_escalation_thresholds: result.changes_escalation_thresholds,
    changes_rollback_thresholds: result.changes_rollback_thresholds,
  };
}
