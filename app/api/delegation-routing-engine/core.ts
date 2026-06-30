import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildDelegationRoutingPackage,
  buildDelegationRoutingVisibilitySurface,
  getDelegationRoutingFramework,
} from "@/services/delegation-routing-engine";
import type { AuthorityValidationPackage } from "@/types/authority-validation-engine";
import type { DelegationRoutingScenario } from "@/types/delegation-routing-engine";

export async function requireDelegationRoutingUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getDelegationRoutingResponse() {
  return getDelegationRoutingFramework();
}

export async function packageDelegationRoutingRequest(request: Request) {
  const body = await readBody(request);
  return buildDelegationRoutingPackage({
    scenario: body.scenario as DelegationRoutingScenario | undefined,
    authorityPackage: body.authorityPackage as AuthorityValidationPackage | undefined,
  });
}

export async function inspectDelegationRoutingRequest(request?: Request) {
  if (!request) return buildDelegationRoutingVisibilitySurface();
  return buildDelegationRoutingVisibilitySurface(await packageDelegationRoutingRequest(request));
}
