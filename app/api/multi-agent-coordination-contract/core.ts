import {
  buildCoordinationObservabilitySurface,
  createCoordinationContract,
  finalizeContract,
  getMultiAgentCoordinationContract,
  registerAgent,
  replayCoordinationContract,
  validateAuthority,
  validateCommunication,
  validateCoordinationContract,
  validateGovernance,
  validateReplay,
} from "@/services/multi-agent-coordination-contract";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { CoordinationContract, CoordinationInput } from "@/types/multi-agent-coordination-contract";

export async function requireMultiAgentCoordinationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function contractFromBody(body: Record<string, unknown>): CoordinationContract {
  return (body.contract as CoordinationContract | undefined) ?? createCoordinationContract(body as CoordinationInput);
}

export function contractResponse() {
  return getMultiAgentCoordinationContract();
}

export async function createRequest(request: Request) {
  return createCoordinationContract((await readBody(request)) as CoordinationInput);
}

export async function registerAgentRequest(request: Request) {
  return registerAgent((await readBody(request)) as CoordinationInput);
}

export async function validateAuthorityRequest(request: Request) {
  return validateAuthority((await readBody(request)) as CoordinationInput);
}

export async function validateGovernanceRequest(request: Request) {
  return validateGovernance((await readBody(request)) as CoordinationInput);
}

export async function validateReplayRequest(request: Request) {
  return validateReplay((await readBody(request)) as CoordinationInput);
}

export async function validateCommunicationRequest(request: Request) {
  return validateCommunication((await readBody(request)) as CoordinationInput);
}

export async function finalizeRequest(request: Request) {
  return finalizeContract((await readBody(request)) as CoordinationInput);
}

export async function replayRequest(request: Request) {
  return replayCoordinationContract(contractFromBody(await readBody(request)));
}

export async function validateRequest(request: Request) {
  return validateCoordinationContract(contractFromBody(await readBody(request)));
}

export async function inspectRequest(request?: Request) {
  if (!request) return buildCoordinationObservabilitySurface();
  return buildCoordinationObservabilitySurface(contractFromBody(await readBody(request)));
}
