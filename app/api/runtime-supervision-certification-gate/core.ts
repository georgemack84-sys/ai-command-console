import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildRuntimeSupervisionCertificationVisibilitySurface,
  getRuntimeSupervisionCertificationGateContract,
  runRuntimeSupervisionCertificationGate,
} from "@/services/runtime-supervision-certification-gate";
import type { InterventionRecommendationPackage } from "@/types/intervention-recommendation-engine";
import type { RuntimeSupervisionCertificationScenario } from "@/types/runtime-supervision-certification-gate";

export async function requireRuntimeSupervisionCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

async function reportFromRequest(request: Request) {
  const body = await readBody(request);
  return runRuntimeSupervisionCertificationGate({
    scenario: body.scenario as RuntimeSupervisionCertificationScenario | undefined,
    recommendationPackage: body.recommendationPackage as InterventionRecommendationPackage | undefined,
  });
}

export function getRuntimeSupervisionCertificationContractResponse() {
  return getRuntimeSupervisionCertificationGateContract();
}

export async function certifyRuntimeSupervisionRequest(request: Request) {
  return reportFromRequest(request);
}

export async function runtimeSupervisionCertificationReportRequest(request: Request) {
  return reportFromRequest(request);
}

export async function runtimeSupervisionCertificationEvidenceRequest(request: Request) {
  return (await reportFromRequest(request)).certification_evidence;
}

export async function runtimeSupervisionCertificationReplayRequest(request: Request) {
  return (await reportFromRequest(request)).replay_certification;
}

export async function runtimeSupervisionCertificationLedgerRequest(request: Request) {
  return (await reportFromRequest(request)).decision_ledger_entry;
}

export async function runtimeSupervisionCertificationVisibilityRequest(request?: Request) {
  if (!request) return buildRuntimeSupervisionCertificationVisibilitySurface();
  const body = await readBody(request);
  return buildRuntimeSupervisionCertificationVisibilitySurface({
    scenario: body.scenario as RuntimeSupervisionCertificationScenario | undefined,
    recommendationPackage: body.recommendationPackage as InterventionRecommendationPackage | undefined,
  });
}
