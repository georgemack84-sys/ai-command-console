import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildGovernanceExplanationObservabilitySurface,
  computeGovernanceExplanationHash,
  explainEscalation,
  explainGovernanceDecision,
  explainPolicyInfluence,
  explainRecommendation,
  explainRiskContribution,
  generateGovernanceExplanation,
  getGovernanceExplainabilityContract,
  runGovernanceExplainability,
  validateGovernanceExplanation,
  verifyExplanationReplay,
} from "@/services/governance-explainability";
import type { GovernanceExplainabilityEngineInput, GovernanceExplanation } from "@/types/governance-explainability";

export async function requireGovernanceExplainabilityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): GovernanceExplainabilityEngineInput {
  return body as GovernanceExplainabilityEngineInput;
}

function explanationFromBody(body: Record<string, unknown>): GovernanceExplanation {
  return (body.explanation as GovernanceExplanation | undefined) ?? generateGovernanceExplanation(inputFromBody(body));
}

export function getGovernanceExplainabilityContractResponse() {
  return getGovernanceExplainabilityContract();
}

export async function generateGovernanceExplanationRequest(request: Request) {
  const body = await readBody(request);
  return runGovernanceExplainability(inputFromBody(body));
}

export async function recommendationExplanationRequest(request: Request) {
  return explainRecommendation(explanationFromBody(await readBody(request)));
}

export async function decisionExplanationRequest(request: Request) {
  return explainGovernanceDecision(explanationFromBody(await readBody(request)));
}

export async function policyExplanationRequest(request: Request) {
  return explainPolicyInfluence(explanationFromBody(await readBody(request)));
}

export async function riskExplanationRequest(request: Request) {
  return explainRiskContribution(explanationFromBody(await readBody(request)));
}

export async function escalationExplanationRequest(request: Request) {
  return explainEscalation(explanationFromBody(await readBody(request)));
}

export async function replayGovernanceExplanationRequest(request: Request) {
  return verifyExplanationReplay(explanationFromBody(await readBody(request)));
}

export async function validateGovernanceExplanationRequest(request: Request) {
  const body = await readBody(request);
  return validateGovernanceExplanation((body.explanation as Partial<GovernanceExplanation> | undefined) ?? generateGovernanceExplanation(inputFromBody(body)));
}

export async function hashGovernanceExplanationRequest(request: Request) {
  return { governance_explanation_hash: computeGovernanceExplanationHash(explanationFromBody(await readBody(request))) };
}

export async function inspectGovernanceExplanationRequest(request?: Request) {
  if (!request) return buildGovernanceExplanationObservabilitySurface();
  return buildGovernanceExplanationObservabilitySurface(inputFromBody(await readBody(request)));
}
