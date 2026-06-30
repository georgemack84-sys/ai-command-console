import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildGovernanceIntegrityCertificationObservabilitySurface,
  computeGovernanceIntegrityCertificationReportHash,
  getGovernanceIntegrityCertificationContract,
  runGovernanceIntegrityCertification,
  validateGovernanceIntegrityCertificationReport,
} from "@/services/governance-integrity-certification";
import type { GovernanceIntegrityCertificationInput, GovernanceIntegrityCertificationReport } from "@/types/governance-integrity-certification";

export async function requireGovernanceIntegrityCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function reportFromBody(body: Record<string, unknown>) {
  return (body.report as GovernanceIntegrityCertificationReport | undefined) ?? runGovernanceIntegrityCertification(body as GovernanceIntegrityCertificationInput);
}

export function getGovernanceIntegrityCertificationContractResponse() {
  return getGovernanceIntegrityCertificationContract();
}

export async function runGovernanceIntegrityCertificationRequest(request: Request) {
  return runGovernanceIntegrityCertification(await readBody(request) as GovernanceIntegrityCertificationInput);
}

export async function validateGovernanceIntegrityCertificationRequest(request: Request) {
  return validateGovernanceIntegrityCertificationReport(reportFromBody(await readBody(request)));
}

export async function hashGovernanceIntegrityCertificationRequest(request: Request) {
  return { governance_integrity_certification_report_hash: computeGovernanceIntegrityCertificationReportHash(reportFromBody(await readBody(request))) };
}

export async function evidenceGovernanceIntegrityCertificationRequest(request: Request) {
  return reportFromBody(await readBody(request)).certification_evidence;
}

export async function testsGovernanceIntegrityCertificationRequest(request: Request) {
  return reportFromBody(await readBody(request)).certification_tests;
}

export async function inspectGovernanceIntegrityCertificationRequest(request?: Request) {
  if (!request) return buildGovernanceIntegrityCertificationObservabilitySurface();
  return buildGovernanceIntegrityCertificationObservabilitySurface(reportFromBody(await readBody(request)));
}
