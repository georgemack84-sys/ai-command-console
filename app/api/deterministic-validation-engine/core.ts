import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildDeterministicValidationObservabilitySurface,
  getDeterministicValidationContract,
  runDeterministicValidation,
  validateDeterministicValidationReport,
} from "@/services/deterministic-validation-engine";
import type { DeterministicValidationInput, DeterministicValidationReport } from "@/types/deterministic-validation-engine";

export async function requireDeterministicValidationEngineUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): DeterministicValidationInput {
  return body as DeterministicValidationInput;
}

function reportFromBody(body: Record<string, unknown>): DeterministicValidationReport {
  return (body.report as DeterministicValidationReport | undefined) ?? runDeterministicValidation(inputFromBody(body));
}

export function getDeterministicValidationContractResponse() { return getDeterministicValidationContract(); }
export async function validationRequest(request: Request) { return runDeterministicValidation(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateDeterministicValidationReport(reportFromBody(await readBody(request))); }
export async function signaturesRequest(request: Request) {
  const report = reportFromBody(await readBody(request));
  return { baseline_execution: report.baseline_execution, comparison_execution: report.comparison_execution };
}
export async function comparisonsRequest(request: Request) { return reportFromBody(await readBody(request)).comparisons; }
export async function evidenceRequest(request: Request) { return reportFromBody(await readBody(request)).evidence; }
export async function assessmentRequest(request: Request) {
  const report = reportFromBody(await readBody(request));
  return { deterministic_result: report.deterministic_result, detected_differences: report.detected_differences, severity: report.severity };
}
export async function inspectDeterministicValidationRequest(request?: Request) {
  if (!request) return buildDeterministicValidationObservabilitySurface();
  return buildDeterministicValidationObservabilitySurface(reportFromBody(await readBody(request)));
}
