import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildVisibilityCertificationObservabilitySurface,
  getVisibilityCertificationContract,
  runVisibilityCertification,
  validateVisibilityCertificationReport,
} from "@/services/mission-control-visibility-certification-gate";
import type { MissionControlVisibilityCertificationReport, VisibilityCertificationInput } from "@/types/mission-control-visibility-certification-gate";

export async function requireVisibilityCertificationGateUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): VisibilityCertificationInput {
  return body as VisibilityCertificationInput;
}

function reportFromBody(body: Record<string, unknown>): MissionControlVisibilityCertificationReport {
  return (body.report as MissionControlVisibilityCertificationReport | undefined) ?? runVisibilityCertification(inputFromBody(body));
}

export function getVisibilityCertificationGateContractResponse() { return getVisibilityCertificationContract(); }
export async function runVisibilityCertificationRequest(request: Request) { return runVisibilityCertification(inputFromBody(await readBody(request))); }
export async function validateVisibilityCertificationRequest(request: Request) { return validateVisibilityCertificationReport(reportFromBody(await readBody(request))); }
export async function visibilityCertificationReportRequest(request: Request) { return reportFromBody(await readBody(request)).certification_report; }
export async function visibilityCertificationEvidenceRequest(request: Request) { return reportFromBody(await readBody(request)).certification_evidence; }
export async function visibilityCertificationTestsRequest(request: Request) { return reportFromBody(await readBody(request)).certification_tests; }
export async function visibilityCertificationScorecardRequest(request: Request) { return reportFromBody(await readBody(request)).scorecard; }
export async function visibilityCertificationReadinessRequest(request: Request) {
  const report = reportFromBody(await readBody(request));
  return { phase_8k_authorized: report.phase_8k_authorized, production_ready: report.production_ready, operator_approval_status: report.operator_approval_status, overall_result: report.overall_result };
}
export async function inspectVisibilityCertificationRequest(request?: Request) {
  if (!request) return buildVisibilityCertificationObservabilitySurface();
  return buildVisibilityCertificationObservabilitySurface(reportFromBody(await readBody(request)));
}
