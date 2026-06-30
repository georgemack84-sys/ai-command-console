import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildSupervisionInterventionBoundaryLookupObservabilitySurface,
  getSupervisionInterventionBoundaryLookupContract,
  runSupervisionInterventionBoundaryLookup,
  validateSupervisionInterventionBoundaryLookup,
} from "@/services/supervision-intervention-boundary-lookup";
import type { SupervisionInterventionBoundaryLookupInput, SupervisionInterventionBoundaryLookupResponse } from "@/types/supervision-intervention-boundary-lookup";

export async function requireSupervisionInterventionBoundaryLookupUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): SupervisionInterventionBoundaryLookupInput {
  return body as SupervisionInterventionBoundaryLookupInput;
}

function responseFromBody(body: Record<string, unknown>): SupervisionInterventionBoundaryLookupResponse {
  return (body.response as SupervisionInterventionBoundaryLookupResponse | undefined) ?? runSupervisionInterventionBoundaryLookup(inputFromBody(body));
}

export function getSupervisionInterventionBoundaryLookupContractResponse() { return getSupervisionInterventionBoundaryLookupContract(); }
export async function runSupervisionInterventionBoundaryLookupRequest(request: Request) { return runSupervisionInterventionBoundaryLookup(inputFromBody(await readBody(request))); }
export async function validateSupervisionInterventionBoundaryLookupRequest(request: Request) { return validateSupervisionInterventionBoundaryLookup(inputFromBody(await readBody(request))); }
export async function supervisionLookupRequest(request: Request) { return responseFromBody(await readBody(request)).supervision_records; }
export async function interventionLookupRequest(request: Request) { return responseFromBody(await readBody(request)).intervention_records; }
export async function boundaryLookupRequest(request: Request) { return responseFromBody(await readBody(request)).boundary_records; }
export async function violationLookupRequest(request: Request) { return responseFromBody(await readBody(request)).violation_records; }
export async function boundaryRejectionLookupRequest(request: Request) { return responseFromBody(await readBody(request)).boundary_rejection_view; }
export async function inspectSupervisionInterventionBoundaryLookupRequest(request?: Request) {
  if (!request) return buildSupervisionInterventionBoundaryLookupObservabilitySurface();
  return buildSupervisionInterventionBoundaryLookupObservabilitySurface(inputFromBody(await readBody(request)));
}
