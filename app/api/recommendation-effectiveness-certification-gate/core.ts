import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  certifyRecommendationEffectiveness,
  computeRecommendationEffectivenessCertificationHash,
  getRecommendationEffectivenessCertificationFoundation,
  replayRecommendationEffectivenessCertification,
} from "@/services/recommendation-effectiveness-certification-gate";
import type { RecommendationEffectivenessCertificationGateResult, RecommendationEffectivenessCertificationInput } from "@/types/recommendation-effectiveness-certification-gate";

export async function requireRecommendationEffectivenessCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getRecommendationEffectivenessCertificationContractResponse() {
  return getRecommendationEffectivenessCertificationFoundation();
}

export async function certifyRecommendationEffectivenessRequest(request: Request) {
  const body = await readBody(request) as RecommendationEffectivenessCertificationInput;
  return certifyRecommendationEffectiveness(body);
}

export async function replayRecommendationEffectivenessCertificationRequest(request: Request) {
  const body = await readBody(request) as Partial<RecommendationEffectivenessCertificationGateResult> & RecommendationEffectivenessCertificationInput;
  const result = body.certification ? body as RecommendationEffectivenessCertificationGateResult : certifyRecommendationEffectiveness(body);
  return {
    replay_valid: replayRecommendationEffectivenessCertification(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
  };
}

export async function governanceRecommendationEffectivenessCertificationRequest(request: Request) {
  const body = await readBody(request) as RecommendationEffectivenessCertificationInput;
  const result = certifyRecommendationEffectiveness(body);
  return result.certification.governance_validation;
}

export async function constitutionalRecommendationEffectivenessCertificationRequest(request: Request) {
  const body = await readBody(request) as RecommendationEffectivenessCertificationInput;
  const result = certifyRecommendationEffectiveness(body);
  return result.certification.constitutional_validation;
}

export async function operatorRecommendationEffectivenessCertificationRequest(request: Request) {
  const body = await readBody(request) as RecommendationEffectivenessCertificationInput;
  const result = certifyRecommendationEffectiveness(body);
  return result.certification.operator_validation;
}

export async function readinessRecommendationEffectivenessCertificationRequest(request: Request) {
  const body = await readBody(request) as RecommendationEffectivenessCertificationInput;
  const result = certifyRecommendationEffectiveness(body);
  return {
    production_readiness: result.certification.production_readiness,
    progression_to_phase_10_4_authorized: result.certification.progression_to_phase_10_4_authorized,
    certification_result: result.certification.certification_result,
  };
}

export async function inspectRecommendationEffectivenessCertificationRequest(request?: Request) {
  if (!request) return getRecommendationEffectivenessCertificationFoundation();
  const body = await readBody(request) as RecommendationEffectivenessCertificationInput;
  const result = certifyRecommendationEffectiveness(body);
  return {
    certification_result: result.certification.certification_result,
    certification_state: result.certification.certification_state,
    failures: result.failures,
    subsystem_count: result.certification.subsystem_results.length,
    certification_hash: computeRecommendationEffectivenessCertificationHash(result.certification),
    phase_10_4_authorized: result.certification.progression_to_phase_10_4_authorized,
  };
}
