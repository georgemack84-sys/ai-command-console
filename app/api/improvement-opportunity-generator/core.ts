import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  computeImprovementOpportunityHash,
  generateImprovementOpportunities,
  getImprovementOpportunityFoundation,
  replayImprovementOpportunityGeneration,
} from "@/services/improvement-opportunity-generator";
import type { ImprovementOpportunityInput, ImprovementOpportunityResult } from "@/types/improvement-opportunity-generator";

export async function requireImprovementOpportunityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getImprovementOpportunityContractResponse() {
  return getImprovementOpportunityFoundation();
}

export async function generateImprovementOpportunityRequest(request: Request) {
  const body = await readBody(request) as ImprovementOpportunityInput;
  return generateImprovementOpportunities(body);
}

export async function registryImprovementOpportunityRequest(request: Request) {
  const body = await readBody(request) as ImprovementOpportunityInput;
  return generateImprovementOpportunities(body).registry;
}

export async function classifyImprovementOpportunityRequest(request: Request) {
  const body = await readBody(request) as ImprovementOpportunityInput;
  const result = generateImprovementOpportunities(body);
  return result.opportunities.map((opportunity) => ({
    improvement_id: opportunity.improvement_id,
    category: opportunity.category,
    classification: opportunity.classification,
    rationale: opportunity.rationale,
    priority: opportunity.implementation_priority,
  }));
}

export async function benefitImprovementOpportunityRequest(request: Request) {
  const body = await readBody(request) as ImprovementOpportunityInput;
  const result = generateImprovementOpportunities(body);
  return result.opportunities.map((opportunity) => ({
    improvement_id: opportunity.improvement_id,
    expected_benefit: opportunity.expected_benefit,
    expected_benefit_summary: opportunity.expected_benefit_summary,
    implementation_complexity: opportunity.implementation_complexity,
  }));
}

export async function governanceImprovementOpportunityRequest(request: Request) {
  const body = await readBody(request) as ImprovementOpportunityInput;
  const result = generateImprovementOpportunities(body);
  return result.opportunities.map((opportunity) => ({
    improvement_id: opportunity.improvement_id,
    governance_required: opportunity.governance_required,
    governance_requirements: opportunity.governance_requirements,
    implementation_authorized: opportunity.implementation_authorized,
  }));
}

export async function validateImprovementOpportunityRequest(request: Request) {
  const body = await readBody(request) as Partial<ImprovementOpportunityResult> & ImprovementOpportunityInput;
  const result = body.registry ? body as ImprovementOpportunityResult : generateImprovementOpportunities(body);
  return {
    validation: result.validation,
    opportunity_hashes: result.opportunities.map((opportunity) => computeImprovementOpportunityHash(opportunity)),
    replay_valid: replayImprovementOpportunityGeneration(result),
  };
}

export async function replayImprovementOpportunityRequest(request: Request) {
  const body = await readBody(request) as Partial<ImprovementOpportunityResult> & ImprovementOpportunityInput;
  const result = body.registry ? body as ImprovementOpportunityResult : generateImprovementOpportunities(body);
  return {
    replay_valid: replayImprovementOpportunityGeneration(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
  };
}

export async function inspectImprovementOpportunityRequest(request?: Request) {
  if (!request) return getImprovementOpportunityFoundation();
  const body = await readBody(request) as ImprovementOpportunityInput;
  const result = generateImprovementOpportunities(body);
  return {
    status: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    opportunities: result.opportunities.length,
    categories: [...new Set(result.opportunities.map((opportunity) => opportunity.category))],
    advisory_only: result.advisory_only,
    modifies_recommendations: result.modifies_recommendations,
  };
}
