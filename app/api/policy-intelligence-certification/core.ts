import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildPolicyIntelligenceCertification,
  buildPolicyIntelligenceCertificationDoctrine,
  buildPolicyIntelligenceCertificationObservabilitySurface,
  buildPolicyIntelligenceCertificationReport,
  collectPolicyIntelligenceCertificationSources,
  computePolicyIntelligenceCertificationHash,
  replayPolicyIntelligenceCertification,
  validatePolicyIntelligenceCertification,
  writePolicyIntelligenceCertificationLedgerRecord,
} from "@/services/policy-intelligence-certification";
import type { PolicyIntelligenceCertification } from "@/types/policy-intelligence-certification";

export async function requirePolicyIntelligenceCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getPolicyIntelligenceCertificationContract() {
  return {
    doctrine: buildPolicyIntelligenceCertificationDoctrine(),
    certification: buildPolicyIntelligenceCertification(),
  };
}

export async function runPolicyIntelligenceCertificationRequest(request: Request) {
  const body = await readBody(request);
  return buildPolicyIntelligenceCertification(collectPolicyIntelligenceCertificationSources(), Boolean(body.conditional));
}

export async function validatePolicyIntelligenceCertificationRequest(request: Request) {
  const body = await readBody(request);
  const certification = (body.certification as Partial<PolicyIntelligenceCertification> | undefined) ?? buildPolicyIntelligenceCertification();
  return validatePolicyIntelligenceCertification(certification);
}

export async function hashPolicyIntelligenceCertificationRequest(request: Request) {
  const body = await readBody(request);
  const certification = (body.certification as PolicyIntelligenceCertification | undefined) ?? buildPolicyIntelligenceCertification();
  return { policy_intelligence_certification_hash: computePolicyIntelligenceCertificationHash(certification) };
}

export async function replayPolicyIntelligenceCertificationRequest(request: Request) {
  const body = await readBody(request);
  const certification = (body.certification as PolicyIntelligenceCertification | undefined) ?? buildPolicyIntelligenceCertification();
  return replayPolicyIntelligenceCertification(certification);
}

export async function reportPolicyIntelligenceCertificationRequest(request: Request) {
  const body = await readBody(request);
  const certification = (body.certification as PolicyIntelligenceCertification | undefined) ?? buildPolicyIntelligenceCertification();
  return buildPolicyIntelligenceCertificationReport(certification);
}

export async function ledgerPolicyIntelligenceCertificationRequest(request: Request) {
  const body = await readBody(request);
  const certification = (body.certification as PolicyIntelligenceCertification | undefined) ?? buildPolicyIntelligenceCertification();
  return writePolicyIntelligenceCertificationLedgerRecord(certification);
}

export async function inspectPolicyIntelligenceCertificationRequest(request?: Request) {
  if (!request) return buildPolicyIntelligenceCertificationObservabilitySurface();
  const body = await readBody(request);
  const certification = (body.certification as PolicyIntelligenceCertification | undefined) ?? buildPolicyIntelligenceCertification();
  return buildPolicyIntelligenceCertificationObservabilitySurface(certification);
}
