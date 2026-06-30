import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildFinalAutonomyCertificationObservabilitySurface,
  getFinalAutonomyCertificationContract,
  runFinalAutonomyCertification,
  validateFinalAutonomyCertificationReport,
} from "@/services/final-autonomy-certification-gate";
import type { FinalAutonomyCertificationInput, FinalAutonomyCertificationReport } from "@/types/final-autonomy-certification-gate";

export async function requireFinalAutonomyCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): FinalAutonomyCertificationInput {
  return body as FinalAutonomyCertificationInput;
}

function reportFromBody(body: Record<string, unknown>): FinalAutonomyCertificationReport {
  return (body.report as FinalAutonomyCertificationReport | undefined) ?? runFinalAutonomyCertification(inputFromBody(body));
}

export function getFinalAutonomyCertificationContractResponse() { return getFinalAutonomyCertificationContract(); }
export async function certificationRequest(request: Request) { return runFinalAutonomyCertification(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateFinalAutonomyCertificationReport(reportFromBody(await readBody(request))); }
export async function evidenceRequest(request: Request) { return reportFromBody(await readBody(request)).evidence; }
export async function testsRequest(request: Request) { return reportFromBody(await readBody(request)).certification_tests; }
export async function resultsRequest(request: Request) { return reportFromBody(await readBody(request)).certification_results; }
export async function readinessRequest(request: Request) {
  const report = reportFromBody(await readBody(request));
  return { overall_state: report.overall_state, phase_9_authorized: report.phase_9_authorized, production_deployment_authorized: report.production_deployment_authorized, approver: report.approver };
}
export async function inspectRequest(request?: Request) {
  if (!request) return buildFinalAutonomyCertificationObservabilitySurface();
  return buildFinalAutonomyCertificationObservabilitySurface(reportFromBody(await readBody(request)));
}
