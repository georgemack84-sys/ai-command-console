import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  getGovernanceConstitutionalStrategyReviewFoundation,
  replayGovernanceConstitutionalStrategyReview,
  reviewGovernanceConstitutionalStrategy,
} from "@/services/governance-constitutional-strategy-review";
import type {
  GovernanceConstitutionalStrategyReviewInput,
  GovernanceConstitutionalStrategyReviewResult,
} from "@/types/governance-constitutional-strategy-review";

export async function requireGovernanceConstitutionalStrategyReviewUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getGovernanceConstitutionalStrategyReviewFoundation();
}

export async function reviewRequest(request: Request) {
  const body = await readBody(request) as GovernanceConstitutionalStrategyReviewInput;
  return reviewGovernanceConstitutionalStrategy(body);
}

export async function reviewsRequest(request: Request) {
  const body = await readBody(request) as GovernanceConstitutionalStrategyReviewInput;
  return reviewGovernanceConstitutionalStrategy(body).reviews;
}

export async function decisionRequest(request: Request) {
  const body = await readBody(request) as GovernanceConstitutionalStrategyReviewInput;
  return reviewGovernanceConstitutionalStrategy(body).reviews.map((review) => ({
    review_id: review.review_id,
    proposal_id: review.proposal_id,
    review_outcome: review.review_outcome,
    simulation_entry_permitted: review.simulation_entry_permitted,
  }));
}

export async function governanceRequest(request: Request) {
  const body = await readBody(request) as GovernanceConstitutionalStrategyReviewInput;
  return reviewGovernanceConstitutionalStrategy(body).reviews.map((review) => ({
    review_id: review.review_id,
    governance_compliance: review.governance_compliance,
    supporting_governance_refs: review.supporting_governance_refs,
  }));
}

export async function constitutionalRequest(request: Request) {
  const body = await readBody(request) as GovernanceConstitutionalStrategyReviewInput;
  return reviewGovernanceConstitutionalStrategy(body).reviews.map((review) => ({
    review_id: review.review_id,
    constitutional_compliance: review.constitutional_compliance,
    advisory_only_validation: review.advisory_only_validation,
    tenant_isolation_status: review.tenant_isolation_status,
  }));
}

export async function authorityRequest(request: Request) {
  const body = await readBody(request) as GovernanceConstitutionalStrategyReviewInput;
  return reviewGovernanceConstitutionalStrategy(body).reviews.map((review) => ({
    review_id: review.review_id,
    authority_verification: review.authority_verification,
    direct_approval: review.direct_approval,
    mutates_strategy: review.mutates_strategy,
  }));
}

export async function policyRequest(request: Request) {
  const body = await readBody(request) as GovernanceConstitutionalStrategyReviewInput;
  return reviewGovernanceConstitutionalStrategy(body).reviews.map((review) => ({
    review_id: review.review_id,
    policy_conflict_summary: review.policy_conflict_summary,
    supporting_policy_refs: review.supporting_policy_refs,
  }));
}

export async function regulatoryRequest(request: Request) {
  const body = await readBody(request) as GovernanceConstitutionalStrategyReviewInput;
  return reviewGovernanceConstitutionalStrategy(body).reviews.map((review) => ({
    review_id: review.review_id,
    regulatory_implications: review.regulatory_implications,
  }));
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<GovernanceConstitutionalStrategyReviewResult> & GovernanceConstitutionalStrategyReviewInput;
  const result = body.registry ? body as GovernanceConstitutionalStrategyReviewResult : reviewGovernanceConstitutionalStrategy(body);
  return {
    replay_valid: replayGovernanceConstitutionalStrategyReview(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    supporting_replay_refs: result.reviews.flatMap((review) => review.supporting_replay_refs),
  };
}

export async function registryRequest(request: Request) {
  const body = await readBody(request) as GovernanceConstitutionalStrategyReviewInput;
  return reviewGovernanceConstitutionalStrategy(body).registry;
}

export async function inspectRequest(request?: Request) {
  if (!request) return getGovernanceConstitutionalStrategyReviewFoundation();
  const body = await readBody(request) as GovernanceConstitutionalStrategyReviewInput;
  const result = reviewGovernanceConstitutionalStrategy(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    reviews: result.reviews.length,
    governance_compliant: result.governance_compliant,
    constitutionally_compliant: result.constitutionally_compliant,
    simulation_entry_permitted: result.simulation_entry_permitted,
  };
}
