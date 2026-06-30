import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildDelegationCertificationVisibilitySurface,
  getDelegationCertificationGateContract,
  runDelegationCertificationGate,
} from "@/services/delegation-certification-gate";
import type { DelegationCertificationScenario } from "@/types/delegation-certification-gate";
import type { DelegationRoutingPackage } from "@/types/delegation-routing-engine";

export async function requireDelegationCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getDelegationCertificationResponse() {
  return getDelegationCertificationGateContract();
}

export async function reportDelegationCertificationRequest(request: Request) {
  const body = await readBody(request);
  return runDelegationCertificationGate({
    scenario: body.scenario as DelegationCertificationScenario | undefined,
    routingPackage: body.routingPackage as DelegationRoutingPackage | undefined,
  });
}

export async function inspectDelegationCertificationRequest(request?: Request) {
  if (!request) return buildDelegationCertificationVisibilitySurface();
  const body = await readBody(request);
  return buildDelegationCertificationVisibilitySurface({
    scenario: body.scenario as DelegationCertificationScenario | undefined,
    routingPackage: body.routingPackage as DelegationRoutingPackage | undefined,
  });
}
