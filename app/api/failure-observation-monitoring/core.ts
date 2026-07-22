import { buildFailureObservationObservabilitySurface, getAnomalyLedger, getFailureObservationContract, getFailureTimeline, getSubsystemHealthReport, observeFailures, replayFailureObservation, validateFailureObservation } from "@/services/failure-observation-monitoring";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { FailureObservationInput, FailureObservationLedger } from "@/types/failure-observation-monitoring";

export async function requireFailureObservationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function ledgerFromBody(body: Record<string, unknown>): FailureObservationLedger {
  return (body.ledger as FailureObservationLedger | undefined) ?? observeFailures(body as FailureObservationInput);
}

export function contractResponse() { return getFailureObservationContract(); }
export async function observeRequest(request: Request) { return observeFailures((await readBody(request)) as FailureObservationInput); }
export async function timelineRequest(request: Request) { return getFailureTimeline((await readBody(request)) as FailureObservationInput); }
export async function healthReportRequest(request: Request) { return getSubsystemHealthReport((await readBody(request)) as FailureObservationInput); }
export async function anomaliesRequest(request: Request) { return getAnomalyLedger((await readBody(request)) as FailureObservationInput); }
export async function replayRequest(request: Request) { return replayFailureObservation(ledgerFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateFailureObservation(ledgerFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildFailureObservationObservabilitySurface();
  return buildFailureObservationObservabilitySurface(ledgerFromBody(await readBody(request)));
}
