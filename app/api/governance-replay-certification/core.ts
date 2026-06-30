import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildGovernanceReplayCertificationObservabilitySurface,
  computeGovernanceReplayCertificationReportHash,
  getGovernanceReplayCertificationContract,
  runGovernanceReplayCertification,
  validateGovernanceReplayCertificationReport,
} from "@/services/governance-replay-certification";
import type { GovernanceReplayCertificationInput, GovernanceReplayCertificationReport } from "@/types/governance-replay-certification";

export async function requireGovernanceReplayCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function reportFromBody(body: Record<string, unknown>) {
  return (body.report as GovernanceReplayCertificationReport | undefined) ?? runGovernanceReplayCertification(body as GovernanceReplayCertificationInput);
}

export function getGovernanceReplayCertificationContractResponse() {
  return getGovernanceReplayCertificationContract();
}

export async function runGovernanceReplayCertificationRequest(request: Request) {
  return runGovernanceReplayCertification(await readBody(request) as GovernanceReplayCertificationInput);
}

export async function validateGovernanceReplayCertificationRequest(request: Request) {
  const body = await readBody(request);
  return validateGovernanceReplayCertificationReport(reportFromBody(body));
}

export async function hashGovernanceReplayCertificationRequest(request: Request) {
  const body = await readBody(request);
  return { governance_replay_certification_report_hash: computeGovernanceReplayCertificationReportHash(reportFromBody(body)) };
}

export async function evidenceGovernanceReplayCertificationRequest(request: Request) {
  const body = await readBody(request);
  return reportFromBody(body).certification_evidence;
}

export async function testsGovernanceReplayCertificationRequest(request: Request) {
  const body = await readBody(request);
  return reportFromBody(body).executed_test_results;
}

export async function inspectGovernanceReplayCertificationRequest(request?: Request) {
  if (!request) return buildGovernanceReplayCertificationObservabilitySurface();
  const body = await readBody(request);
  return buildGovernanceReplayCertificationObservabilitySurface(reportFromBody(body));
}
