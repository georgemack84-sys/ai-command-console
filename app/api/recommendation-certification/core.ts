import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildRecommendationCertificationContract,
  buildRecommendationCertificationObservabilitySurface,
  buildRecommendationCertificationRecord,
  buildRecommendationCertificationReport,
  computeRecommendationCertificationHash,
  replayRecommendationCertification,
  runRecommendationCertification,
  validateRecommendationCertificationRecord,
} from "@/services/recommendation-certification";
import type { RecommendationCertificationComponentKey, RecommendationCertificationRecord, RecommendationCertificationTestResult } from "@/types/recommendation-certification";

export async function requireRecommendationCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getRecommendationCertificationContract() {
  return buildRecommendationCertificationContract();
}

export async function runRecommendationCertificationRequest(request: Request) {
  const body = await readBody(request) as { tenant_id?: string; mission_id?: string; component_overrides?: Partial<Record<RecommendationCertificationComponentKey, Partial<RecommendationCertificationTestResult>>> };
  return runRecommendationCertification(body);
}

export async function validateRecommendationCertificationRequest(request: Request) {
  const body = await readBody(request);
  return validateRecommendationCertificationRecord(Object.keys(body).length ? body as Partial<RecommendationCertificationRecord> : runRecommendationCertification());
}

export async function replayRecommendationCertificationRequest(request: Request) {
  const body = await readBody(request);
  return replayRecommendationCertification(Object.keys(body).length ? buildRecommendationCertificationRecord(body as Partial<RecommendationCertificationRecord>) : runRecommendationCertification());
}

export async function hashRecommendationCertificationRequest(request: Request) {
  const body = await readBody(request);
  const record = Object.keys(body).length ? buildRecommendationCertificationRecord(body as Partial<RecommendationCertificationRecord>) : runRecommendationCertification();
  return { recommendation_certification_hash: computeRecommendationCertificationHash(record) };
}

export async function inspectRecommendationCertificationRequest(request?: Request) {
  if (!request) return buildRecommendationCertificationObservabilitySurface();
  const body = await readBody(request);
  return buildRecommendationCertificationObservabilitySurface(Object.keys(body).length ? buildRecommendationCertificationRecord(body as Partial<RecommendationCertificationRecord>) : runRecommendationCertification());
}

export async function reportRecommendationCertificationRequest(request?: Request) {
  if (!request) return buildRecommendationCertificationReport();
  const body = await readBody(request);
  return buildRecommendationCertificationReport(Object.keys(body).length ? buildRecommendationCertificationRecord(body as Partial<RecommendationCertificationRecord>) : runRecommendationCertification());
}
