import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildPolicyAnalysisObservabilitySurface,
  buildPolicyAnalysisRecord,
  computePolicyAnalysisHash,
  replayPolicyAnalysis,
  transitionPolicyAnalysisState,
  validatePolicyAnalysisRecord,
} from "@/services/policy-analysis";
import type { PolicyAnalysisRecord, PolicyAnalysisState } from "@/types/policy-analysis";

export async function requirePolicyAnalysisUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getDefaultPolicyAnalysisRecord() {
  return buildPolicyAnalysisRecord();
}

export async function validatePolicyAnalysisRequest(request: Request) {
  const body = await readBody(request) as Partial<PolicyAnalysisRecord>;
  return validatePolicyAnalysisRecord(Object.keys(body).length ? body : getDefaultPolicyAnalysisRecord());
}

export async function hashPolicyAnalysisRequest(request: Request) {
  const body = await readBody(request) as Partial<PolicyAnalysisRecord>;
  const record = Object.keys(body).length ? buildPolicyAnalysisRecord(body) : getDefaultPolicyAnalysisRecord();
  return { policy_analysis_hash: computePolicyAnalysisHash(record) };
}

export async function transitionPolicyAnalysisRequest(request: Request) {
  const body = await readBody(request) as {
    record?: Partial<PolicyAnalysisRecord>;
    to_state?: PolicyAnalysisState;
  };
  return transitionPolicyAnalysisState(buildPolicyAnalysisRecord(body.record ?? {}), body.to_state ?? "VALIDATED");
}

export async function replayPolicyAnalysisRequest(request: Request) {
  const body = await readBody(request) as Partial<PolicyAnalysisRecord>;
  return replayPolicyAnalysis(Object.keys(body).length ? buildPolicyAnalysisRecord(body) : getDefaultPolicyAnalysisRecord());
}

export async function inspectPolicyAnalysisRequest(request?: Request) {
  if (!request) return buildPolicyAnalysisObservabilitySurface(getDefaultPolicyAnalysisRecord());
  const body = await readBody(request) as Partial<PolicyAnalysisRecord>;
  return buildPolicyAnalysisObservabilitySurface(Object.keys(body).length ? buildPolicyAnalysisRecord(body) : getDefaultPolicyAnalysisRecord());
}
