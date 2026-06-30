import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildDriftHealthDashboardSurface,
  buildDriftHealthPackage,
  getDriftHealthFramework,
} from "@/services/drift-health-intelligence";
import type { DriftHealthPackage, DriftHealthScenario } from "@/types/drift-health-intelligence";
import type { RuntimeObservationPackage } from "@/types/runtime-observation-engine";

export async function requireDriftHealthIntelligenceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function packageFromBody(body: Record<string, unknown>): DriftHealthPackage {
  return (body.package as DriftHealthPackage | undefined) ?? buildDriftHealthPackage({
    scenario: body.scenario as DriftHealthScenario | undefined,
    observationPackage: body.observationPackage as RuntimeObservationPackage | undefined,
  });
}

export function getDriftHealthContractResponse() {
  return getDriftHealthFramework();
}

export async function analyzeDriftHealthRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body);
}

export async function validateDriftHealthRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).validation;
}

export async function replayDriftHealthRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).replay;
}

export async function driftHealthEvidenceRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).drift_evidence;
}

export async function driftHealthAssessmentRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).health_assessment;
}

export async function driftHealthAlertRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).supervision_alert;
}

export async function inspectDriftHealthRequest(request?: Request) {
  if (!request) return buildDriftHealthDashboardSurface();
  const body = await readBody(request);
  return buildDriftHealthDashboardSurface(packageFromBody(body));
}
