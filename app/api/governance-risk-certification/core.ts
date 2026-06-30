import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildGovernanceRiskCertificationDoctrine,
  buildGovernanceRiskCertificationRecord,
  buildGovernanceRiskCertificationReport,
  computeGovernanceRiskCertificationHash,
  replayGovernanceRiskCertification,
  runGovernanceRiskCertification,
  validateGovernanceRiskCertificationRecord,
} from "@/services/governance-risk-certification";
import type { GovernanceRiskCertificationRecord } from "@/types/governance-risk-certification";

export async function requireGovernanceRiskCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getGovernanceRiskCertificationContract() {
  return {
    doctrine: buildGovernanceRiskCertificationDoctrine(),
    record: buildGovernanceRiskCertificationRecord(),
  };
}

export async function runGovernanceRiskCertificationRequest(request: Request) {
  const body = await readBody(request);
  return runGovernanceRiskCertification(body);
}

export async function validateGovernanceRiskCertificationRequest(request: Request) {
  const body = await readBody(request);
  return validateGovernanceRiskCertificationRecord(Object.keys(body).length ? body as Partial<GovernanceRiskCertificationRecord> : buildGovernanceRiskCertificationRecord());
}

export async function hashGovernanceRiskCertificationRequest(request: Request) {
  const body = await readBody(request);
  const record = Object.keys(body).length ? buildGovernanceRiskCertificationRecord(body as Partial<GovernanceRiskCertificationRecord>) : buildGovernanceRiskCertificationRecord();
  return { governance_risk_certification_hash: computeGovernanceRiskCertificationHash(record) };
}

export async function replayGovernanceRiskCertificationRequest(request: Request) {
  const body = await readBody(request);
  return replayGovernanceRiskCertification(Object.keys(body).length ? buildGovernanceRiskCertificationRecord(body as Partial<GovernanceRiskCertificationRecord>) : buildGovernanceRiskCertificationRecord());
}

export async function inspectGovernanceRiskCertificationRequest(request?: Request) {
  if (!request) return buildGovernanceRiskCertificationReport();
  const body = await readBody(request);
  return buildGovernanceRiskCertificationReport(Object.keys(body).length ? buildGovernanceRiskCertificationRecord(body as Partial<GovernanceRiskCertificationRecord>) : buildGovernanceRiskCertificationRecord());
}
