import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildDelegationOrchestrationLookupObservabilitySurface,
  getDelegationOrchestrationLookupContract,
  runDelegationOrchestrationLookup,
  validateDelegationOrchestrationLookup,
} from "@/services/delegation-orchestration-lookup";
import type { DelegationOrchestrationLookupInput, DelegationOrchestrationLookupResponse } from "@/types/delegation-orchestration-lookup";

export async function requireDelegationOrchestrationLookupUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): DelegationOrchestrationLookupInput {
  return body as DelegationOrchestrationLookupInput;
}

function responseFromBody(body: Record<string, unknown>): DelegationOrchestrationLookupResponse {
  return (body.response as DelegationOrchestrationLookupResponse | undefined) ?? runDelegationOrchestrationLookup(inputFromBody(body));
}

export function getDelegationOrchestrationLookupContractResponse() { return getDelegationOrchestrationLookupContract(); }
export async function runDelegationOrchestrationLookupRequest(request: Request) { return runDelegationOrchestrationLookup(inputFromBody(await readBody(request))); }
export async function validateDelegationOrchestrationLookupRequest(request: Request) { return validateDelegationOrchestrationLookup(inputFromBody(await readBody(request))); }
export async function delegationLookupRequest(request: Request) { return responseFromBody(await readBody(request)).delegation_records; }
export async function orchestrationLookupRequest(request: Request) { return responseFromBody(await readBody(request)).orchestration_records; }
export async function routingLookupRequest(request: Request) { return responseFromBody(await readBody(request)).routing_view; }
export async function dependencyLookupRequest(request: Request) { return responseFromBody(await readBody(request)).dependency_records; }
export async function checkpointLookupRequest(request: Request) { return responseFromBody(await readBody(request)).checkpoint_records; }
export async function timelineLookupRequest(request: Request) { return responseFromBody(await readBody(request)).timeline; }
export async function inspectDelegationOrchestrationLookupRequest(request?: Request) {
  if (!request) return buildDelegationOrchestrationLookupObservabilitySurface();
  return buildDelegationOrchestrationLookupObservabilitySurface(inputFromBody(await readBody(request)));
}
