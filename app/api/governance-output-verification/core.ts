import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildGovernanceOutputAuditLog,
  buildGovernanceOutputObservabilitySurface,
  computeGovernanceOutputVerificationReportHash,
  getGovernanceOutputVerificationContract,
  validateGovernanceOutputVerificationReport,
  verifyGovernanceOutputs,
} from "@/services/governance-output-verification";
import type { GovernanceOutputVerificationInput, GovernanceOutputVerificationReport } from "@/types/governance-output-verification";

export async function requireGovernanceOutputVerificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function reportFromBody(body: Record<string, unknown>) {
  return (body.report as GovernanceOutputVerificationReport | undefined) ?? verifyGovernanceOutputs(body as GovernanceOutputVerificationInput);
}

export function getGovernanceOutputVerificationContractResponse() {
  return getGovernanceOutputVerificationContract();
}

export async function verifyGovernanceOutputsRequest(request: Request) {
  return verifyGovernanceOutputs(await readBody(request) as GovernanceOutputVerificationInput);
}

export async function validateGovernanceOutputsRequest(request: Request) {
  const body = await readBody(request);
  return validateGovernanceOutputVerificationReport(reportFromBody(body));
}

export async function hashGovernanceOutputsRequest(request: Request) {
  const body = await readBody(request);
  return { governance_output_verification_report_hash: computeGovernanceOutputVerificationReportHash(reportFromBody(body)) };
}

export async function comparisonRequest(request: Request, key: keyof GovernanceOutputVerificationReport) {
  const body = await readBody(request);
  return reportFromBody(body)[key];
}

export async function auditGovernanceOutputsRequest(request: Request) {
  const body = await readBody(request);
  return buildGovernanceOutputAuditLog(reportFromBody(body));
}

export async function inspectGovernanceOutputsRequest(request?: Request) {
  if (!request) return buildGovernanceOutputObservabilitySurface();
  const body = await readBody(request);
  return buildGovernanceOutputObservabilitySurface(reportFromBody(body));
}
