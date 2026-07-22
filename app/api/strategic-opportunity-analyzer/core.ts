import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  analyzeStrategicOpportunities,
  getStrategicOpportunityAnalyzerFoundation,
  replayStrategicOpportunityAnalysis,
} from "@/services/strategic-opportunity-analyzer";
import type { StrategicOpportunityInput, StrategicOpportunityResult } from "@/types/strategic-opportunity-analyzer";

export async function requireStrategicOpportunityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getStrategicOpportunityAnalyzerFoundation();
}

export async function analyzeRequest(request: Request) {
  const body = await readBody(request) as StrategicOpportunityInput;
  return analyzeStrategicOpportunities(body);
}

export async function opportunitiesRequest(request: Request) {
  const body = await readBody(request) as StrategicOpportunityInput;
  return analyzeStrategicOpportunities(body).opportunities;
}

export async function rankingRequest(request: Request) {
  const body = await readBody(request) as StrategicOpportunityInput;
  const result = analyzeStrategicOpportunities(body);
  return result.opportunities.map((opportunity) => ({
    opportunity_id: opportunity.opportunity_id,
    opportunity_score: opportunity.opportunity_score,
    ranking_position: opportunity.ranking_position,
    category: opportunity.opportunity_category,
  }));
}

export async function evidenceRequest(request: Request) {
  const body = await readBody(request) as StrategicOpportunityInput;
  return analyzeStrategicOpportunities(body).opportunities.map((opportunity) => ({
    opportunity_id: opportunity.opportunity_id,
    supporting_pattern_refs: opportunity.supporting_pattern_refs,
    supporting_outcome_refs: opportunity.supporting_outcome_refs,
    supporting_recommendation_refs: opportunity.supporting_recommendation_refs,
    supporting_decision_refs: opportunity.supporting_decision_refs,
  }));
}

export async function governanceRequest(request: Request) {
  const body = await readBody(request) as StrategicOpportunityInput;
  return analyzeStrategicOpportunities(body).opportunities.map((opportunity) => ({
    opportunity_id: opportunity.opportunity_id,
    governance_impact: opportunity.governance_impact,
    supporting_governance_refs: opportunity.supporting_governance_refs,
  }));
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<StrategicOpportunityResult> & StrategicOpportunityInput;
  const result = body.registry ? body as StrategicOpportunityResult : analyzeStrategicOpportunities(body);
  return {
    replay_valid: replayStrategicOpportunityAnalysis(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    supporting_replay_refs: result.opportunities.flatMap((opportunity) => opportunity.supporting_replay_refs),
  };
}

export async function registryRequest(request: Request) {
  const body = await readBody(request) as StrategicOpportunityInput;
  return analyzeStrategicOpportunities(body).registry;
}

export async function inspectRequest(request?: Request) {
  if (!request) return getStrategicOpportunityAnalyzerFoundation();
  const body = await readBody(request) as StrategicOpportunityInput;
  const result = analyzeStrategicOpportunities(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    opportunities: result.opportunities.length,
    evidence_backed: result.evidence_backed,
    governance_compliant: result.governance_compliant,
    advisory_only: result.advisory_only,
    generates_proposals: result.generates_proposals,
  };
}
