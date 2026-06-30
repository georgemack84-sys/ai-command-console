import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildSecurityGovernanceObservabilitySurface,
  getSecurityGovernanceValidationContract,
  runSecurityGovernanceValidation,
  validateSecurityGovernanceValidationReport,
} from "@/services/security-governance-validation-engine";
import type { SecurityGovernanceValidationInput, SecurityGovernanceValidationReport } from "@/types/security-governance-validation-engine";

export async function requireSecurityGovernanceValidationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): SecurityGovernanceValidationInput {
  return body as SecurityGovernanceValidationInput;
}

function reportFromBody(body: Record<string, unknown>): SecurityGovernanceValidationReport {
  return (body.report as SecurityGovernanceValidationReport | undefined) ?? runSecurityGovernanceValidation(inputFromBody(body));
}

export function getSecurityGovernanceValidationContractResponse() { return getSecurityGovernanceValidationContract(); }
export async function validationRequest(request: Request) { return runSecurityGovernanceValidation(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateSecurityGovernanceValidationReport(reportFromBody(await readBody(request))); }
export async function domainsRequest(request: Request) {
  const report = reportFromBody(await readBody(request));
  return [report.governance_validation, report.constitutional_validation, report.authority_validation, report.policy_validation, report.security_validation, report.boundary_validation, report.tenant_validation, report.visibility_validation, report.fail_closed_validation];
}
export async function evidenceRequest(request: Request) { return reportFromBody(await readBody(request)).evidence; }
export async function assessmentRequest(request: Request) {
  const report = reportFromBody(await readBody(request));
  return { overall_security_score: report.overall_security_score, detected_violations: report.detected_violations, operator_required: report.operator_required };
}
export async function risksRequest(request: Request) { return reportFromBody(await readBody(request)).detected_risks; }
export async function inspectRequest(request?: Request) {
  if (!request) return buildSecurityGovernanceObservabilitySurface();
  return buildSecurityGovernanceObservabilitySurface(reportFromBody(await readBody(request)));
}
