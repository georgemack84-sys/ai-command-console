import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildRuntimeObservationDashboardSurface,
  buildRuntimeObservationPackage,
  getRuntimeObservationFramework,
} from "@/services/runtime-observation-engine";
import type { RuntimeObservationPackage, RuntimeObservationScenario } from "@/types/runtime-observation-engine";
import type { RuntimeSupervisionContract } from "@/types/runtime-supervision-contract";

export async function requireRuntimeObservationEngineUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function packageFromBody(body: Record<string, unknown>): RuntimeObservationPackage {
  return (body.package as RuntimeObservationPackage | undefined) ?? buildRuntimeObservationPackage({
    scenario: body.scenario as RuntimeObservationScenario | undefined,
    supervisionContract: body.supervisionContract as RuntimeSupervisionContract | undefined,
  });
}

export function getRuntimeObservationContractResponse() {
  return getRuntimeObservationFramework();
}

export async function createRuntimeObservationRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body);
}

export async function validateRuntimeObservationRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).validation;
}

export async function replayRuntimeObservationRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).replay;
}

export async function runtimeObservationEvidenceRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).runtime_evidence;
}

export async function runtimeObservationTimelineRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).monitoring_timeline;
}

export async function inspectRuntimeObservationRequest(request?: Request) {
  if (!request) return buildRuntimeObservationDashboardSurface();
  const body = await readBody(request);
  return buildRuntimeObservationDashboardSurface(packageFromBody(body));
}
