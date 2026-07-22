import {
  buildDelegationObservabilitySurface,
  computeFallbackRoute,
  detectDelegationConflicts,
  finalizeDelegationMap,
  generateDelegationMap,
  getDeterministicDelegationAssurance,
  replayDelegationAssurance,
  validateCapabilityMatch,
  validateDelegationAssurance,
  validateDelegationAuthority,
  validateDelegationReplay,
} from "@/services/deterministic-delegation-assurance";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { DelegationContract, DelegationInput } from "@/types/deterministic-delegation-assurance";

export async function requireDeterministicDelegationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function contractFromBody(body: Record<string, unknown>): DelegationContract {
  return (body.contract as DelegationContract | undefined) ?? generateDelegationMap(body as DelegationInput);
}

export function contractResponse() { return getDeterministicDelegationAssurance(); }
export async function generateRequest(request: Request) { return generateDelegationMap((await readBody(request)) as DelegationInput); }
export async function validateCapabilityRequest(request: Request) { return validateCapabilityMatch((await readBody(request)) as DelegationInput); }
export async function validateAuthorityRequest(request: Request) { return validateDelegationAuthority((await readBody(request)) as DelegationInput); }
export async function computeFallbackRequest(request: Request) { return computeFallbackRoute((await readBody(request)) as DelegationInput); }
export async function detectConflictsRequest(request: Request) { return detectDelegationConflicts((await readBody(request)) as DelegationInput); }
export async function validateReplayRequest(request: Request) { return validateDelegationReplay((await readBody(request)) as DelegationInput); }
export async function finalizeRequest(request: Request) { return finalizeDelegationMap((await readBody(request)) as DelegationInput); }
export async function replayRequest(request: Request) { return replayDelegationAssurance(contractFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateDelegationAssurance(contractFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildDelegationObservabilitySurface();
  return buildDelegationObservabilitySurface(contractFromBody(await readBody(request)));
}
