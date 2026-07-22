import {
  buildContinuousMaturityMonitoringObservabilitySurface,
  getContinuousMaturityMonitoringBundle,
  listMaturityMonitoringAlerts,
  listMaturityMonitoringChanges,
  listMaturityMonitoringLedger,
  listMaturityMonitoringTriggers,
  runContinuousMaturityMonitoring,
  validateContinuousMaturityMonitoring,
} from "@/services/continuous-maturity-monitoring";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ContinuousMaturityMonitoringInput, ContinuousMaturityMonitoringRepository } from "@/types/continuous-maturity-monitoring";

export async function requireContinuousMonitoringUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): ContinuousMaturityMonitoringRepository {
  return (body.repository as ContinuousMaturityMonitoringRepository | undefined) ?? runContinuousMaturityMonitoring(body as ContinuousMaturityMonitoringInput);
}

export function monitoringBundleResponse() { return getContinuousMaturityMonitoringBundle(); }
export async function monitorRequest(request: Request) { return runContinuousMaturityMonitoring((await readBody(request)) as ContinuousMaturityMonitoringInput); }
export async function changesRequest(request: Request) { return listMaturityMonitoringChanges((await readBody(request)) as ContinuousMaturityMonitoringInput); }
export async function triggersRequest(request: Request) { return listMaturityMonitoringTriggers((await readBody(request)) as ContinuousMaturityMonitoringInput); }
export async function alertsRequest(request: Request) { return listMaturityMonitoringAlerts((await readBody(request)) as ContinuousMaturityMonitoringInput); }
export async function ledgerRequest(request: Request) { return listMaturityMonitoringLedger((await readBody(request)) as ContinuousMaturityMonitoringInput); }
export async function validateRequest(request: Request) { return validateContinuousMaturityMonitoring(repositoryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildContinuousMaturityMonitoringObservabilitySurface();
  return buildContinuousMaturityMonitoringObservabilitySurface(repositoryFromBody(await readBody(request)));
}
