import {
  buildAuthorityObservabilitySurface,
  createAuthoritySeparationContract,
  detectAuthorityConflicts,
  finalizeAuthoritySeparation,
  generateAuthorityConflictMap,
  getAuthoritySeparationAssurance,
  replayAuthoritySeparation,
  validateAuthorityProfiles,
  validateAuthorityReplay,
  validateAuthoritySeparation,
  validateEscalation,
  verifyRoleSeparation,
} from "@/services/authority-separation-assurance";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { AuthorityContract, AuthorityInput } from "@/types/authority-separation-assurance";

export async function requireAuthoritySeparationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function contractFromBody(body: Record<string, unknown>): AuthorityContract {
  return (body.contract as AuthorityContract | undefined) ?? createAuthoritySeparationContract(body as AuthorityInput);
}

export function contractResponse() { return getAuthoritySeparationAssurance(); }
export async function validateProfilesRequest(request: Request) { return validateAuthorityProfiles((await readBody(request)) as AuthorityInput); }
export async function verifyRoleSeparationRequest(request: Request) { return verifyRoleSeparation((await readBody(request)) as AuthorityInput); }
export async function validateEscalationRequest(request: Request) { return validateEscalation((await readBody(request)) as AuthorityInput); }
export async function detectConflictsRequest(request: Request) { return detectAuthorityConflicts((await readBody(request)) as AuthorityInput); }
export async function conflictMapRequest(request: Request) { return generateAuthorityConflictMap((await readBody(request)) as AuthorityInput); }
export async function validateReplayRequest(request: Request) { return validateAuthorityReplay((await readBody(request)) as AuthorityInput); }
export async function finalizeRequest(request: Request) { return finalizeAuthoritySeparation((await readBody(request)) as AuthorityInput); }
export async function replayRequest(request: Request) { return replayAuthoritySeparation(contractFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateAuthoritySeparation(contractFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildAuthorityObservabilitySurface();
  return buildAuthorityObservabilitySurface(contractFromBody(await readBody(request)));
}
