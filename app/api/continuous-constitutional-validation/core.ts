import {
  buildContinuousConstitutionalObservabilitySurface,
  getContinuousConstitutionalValidationEngine,
  listConstitutionalComplianceTimeline,
  listConstitutionalTrendAssessments,
  listConstitutionalValidationReports,
  listConstitutionalViolationAlerts,
  listContinuousConstitutionalAuditRecords,
  validateContinuousConstitutionalCompliance,
  validateContinuousConstitutionalRepository,
} from "@/services/continuous-constitutional-validation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ContinuousConstitutionalInput, ContinuousConstitutionalValidationRepository } from "@/types/continuous-constitutional-validation";

export async function requireContinuousConstitutionalUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): ContinuousConstitutionalValidationRepository {
  return (body.repository as ContinuousConstitutionalValidationRepository | undefined) ?? validateContinuousConstitutionalCompliance(body as ContinuousConstitutionalInput);
}

export function contractResponse() { return getContinuousConstitutionalValidationEngine(); }
export async function validateRequest(request: Request) { return validateContinuousConstitutionalCompliance((await readBody(request)) as ContinuousConstitutionalInput); }
export async function reportsRequest(request: Request) { return listConstitutionalValidationReports((await readBody(request)) as ContinuousConstitutionalInput); }
export async function timelineRequest(request: Request) { return listConstitutionalComplianceTimeline((await readBody(request)) as ContinuousConstitutionalInput); }
export async function alertsRequest(request: Request) { return listConstitutionalViolationAlerts((await readBody(request)) as ContinuousConstitutionalInput); }
export async function trendsRequest(request: Request) { return listConstitutionalTrendAssessments((await readBody(request)) as ContinuousConstitutionalInput); }
export async function auditRequest(request: Request) { return listContinuousConstitutionalAuditRecords((await readBody(request)) as ContinuousConstitutionalInput); }
export async function resultRequest(request: Request) { return validateContinuousConstitutionalRepository(repositoryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildContinuousConstitutionalObservabilitySurface();
  return buildContinuousConstitutionalObservabilitySurface(repositoryFromBody(await readBody(request)));
}
