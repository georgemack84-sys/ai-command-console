import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildMissionHealthCertificationObservabilitySurface,
  certifyMissionHealth,
  getMissionHealthCertificationGateContract,
  replayMissionHealthCertification,
  validateMissionHealthCertification,
} from "@/services/mission-health-certification-gate";
import type { MissionHealthCertification, MissionHealthCertificationInput } from "@/types/mission-health-certification-gate";

export async function requireMissionHealthCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): MissionHealthCertificationInput {
  return body as MissionHealthCertificationInput;
}

function certificationFromBody(body: Record<string, unknown>): MissionHealthCertification {
  return (body.certification as MissionHealthCertification | undefined) ?? certifyMissionHealth(inputFromBody(body));
}

export function contractResponse() { return getMissionHealthCertificationGateContract(); }
export async function certifyRequest(request: Request) { return certifyMissionHealth(inputFromBody(await readBody(request))); }
export async function reportRequest(request: Request) { return certificationFromBody(await readBody(request)).report; }
export async function componentResultsRequest(request: Request) { return certificationFromBody(await readBody(request)).component_results; }
export async function testResultsRequest(request: Request) { return certificationFromBody(await readBody(request)).test_results; }
export async function replayValidationRequest(request: Request) { return certificationFromBody(await readBody(request)).replay_status; }
export async function governanceValidationRequest(request: Request) { return certificationFromBody(await readBody(request)).governance_status; }
export async function integrityValidationRequest(request: Request) { return certificationFromBody(await readBody(request)).integrity_status; }
export async function securityValidationRequest(request: Request) { return certificationFromBody(await readBody(request)).security_status; }
export async function replayRequest(request: Request) { return replayMissionHealthCertification(certificationFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateMissionHealthCertification(certificationFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildMissionHealthCertificationObservabilitySurface();
  return buildMissionHealthCertificationObservabilitySurface(certificationFromBody(await readBody(request)));
}
