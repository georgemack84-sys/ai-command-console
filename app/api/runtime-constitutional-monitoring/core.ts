import {
  buildRuntimeConstitutionalMonitoringObservabilitySurface,
  getRuntimeConstitutionalMonitoringEngine,
  getRuntimeConstitutionHealth,
  listRuntimeComplianceStatus,
  listRuntimeConstitutionalAuditRecords,
  listRuntimeMonitoringLedger,
  listRuntimeMonitoringTimeline,
  listRuntimeRiskIndicators,
  monitorRuntimeConstitutionalCompliance,
  validateRuntimeConstitutionalMonitoring,
} from "@/services/runtime-constitutional-monitoring";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { RuntimeConstitutionalMonitoringInput, RuntimeConstitutionalMonitoringRepository } from "@/types/runtime-constitutional-monitoring";

export async function requireRuntimeConstitutionalMonitoringUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): RuntimeConstitutionalMonitoringRepository {
  return (body.repository as RuntimeConstitutionalMonitoringRepository | undefined) ?? monitorRuntimeConstitutionalCompliance(body as RuntimeConstitutionalMonitoringInput);
}

export function contractResponse() { return getRuntimeConstitutionalMonitoringEngine(); }
export async function monitorRequest(request: Request) { return monitorRuntimeConstitutionalCompliance((await readBody(request)) as RuntimeConstitutionalMonitoringInput); }
export async function statusRequest(request: Request) { return listRuntimeComplianceStatus((await readBody(request)) as RuntimeConstitutionalMonitoringInput); }
export async function healthRequest(request: Request) { return getRuntimeConstitutionHealth((await readBody(request)) as RuntimeConstitutionalMonitoringInput); }
export async function timelineRequest(request: Request) { return listRuntimeMonitoringTimeline((await readBody(request)) as RuntimeConstitutionalMonitoringInput); }
export async function risksRequest(request: Request) { return listRuntimeRiskIndicators((await readBody(request)) as RuntimeConstitutionalMonitoringInput); }
export async function ledgerRequest(request: Request) { return listRuntimeMonitoringLedger((await readBody(request)) as RuntimeConstitutionalMonitoringInput); }
export async function auditRequest(request: Request) { return listRuntimeConstitutionalAuditRecords((await readBody(request)) as RuntimeConstitutionalMonitoringInput); }
export async function validateRequest(request: Request) { return validateRuntimeConstitutionalMonitoring(repositoryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildRuntimeConstitutionalMonitoringObservabilitySurface();
  return buildRuntimeConstitutionalMonitoringObservabilitySurface(repositoryFromBody(await readBody(request)));
}
