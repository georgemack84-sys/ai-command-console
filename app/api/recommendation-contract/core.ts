import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildRecommendationContractRecord,
  buildRecommendationObservabilitySurface,
  certifyRecommendationContract,
  computeRecommendationHash,
  getRecommendationContract,
  replayRecommendationContract,
  transitionRecommendationLifecycle,
  validateRecommendationContractRecord,
} from "@/services/recommendation-contract";
import type { RecommendationContractRecord, RecommendationLifecycleState } from "@/types/recommendation-contract";

export async function requireRecommendationContractUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getRecommendationContractResponse() {
  return getRecommendationContract();
}

export async function validateRecommendationContractRequest(request: Request) {
  const body = await readBody(request);
  return validateRecommendationContractRecord(Object.keys(body).length ? body as Partial<RecommendationContractRecord> : buildRecommendationContractRecord());
}

export async function hashRecommendationContractRequest(request: Request) {
  const body = await readBody(request);
  const record = Object.keys(body).length ? buildRecommendationContractRecord(body as Partial<RecommendationContractRecord>) : buildRecommendationContractRecord();
  return { recommendation_hash: computeRecommendationHash(record) };
}

export async function replayRecommendationContractRequest(request: Request) {
  const body = await readBody(request);
  return replayRecommendationContract(Object.keys(body).length ? buildRecommendationContractRecord(body as Partial<RecommendationContractRecord>) : buildRecommendationContractRecord());
}

export async function inspectRecommendationContractRequest(request?: Request) {
  if (!request) return buildRecommendationObservabilitySurface();
  const body = await readBody(request);
  return buildRecommendationObservabilitySurface(Object.keys(body).length ? buildRecommendationContractRecord(body as Partial<RecommendationContractRecord>) : buildRecommendationContractRecord());
}

export async function certifyRecommendationContractRequest(request?: Request) {
  if (!request) return certifyRecommendationContract();
  const body = await readBody(request);
  return certifyRecommendationContract(Object.keys(body).length ? buildRecommendationContractRecord(body as Partial<RecommendationContractRecord>) : buildRecommendationContractRecord());
}

export async function transitionRecommendationContractRequest(request: Request) {
  const body = await readBody(request) as { from_state?: RecommendationLifecycleState; to_state?: RecommendationLifecycleState };
  return transitionRecommendationLifecycle(body.from_state ?? "DRAFT", body.to_state ?? "EVIDENCE_BOUND");
}
