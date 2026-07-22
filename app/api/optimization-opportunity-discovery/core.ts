import {
  buildOptimizationDiscoveryObservabilitySurface,
  discoverOptimizationOpportunities,
  getOptimizationOpportunityDiscovery,
  listDiscoveryEvidence,
  listPerformanceBaselines,
  validateOptimizationDiscovery,
} from "@/services/optimization-opportunity-discovery";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { OptimizationDiscoveryInput, OptimizationOpportunityRegistry } from "@/types/optimization-opportunity-discovery";

export async function requireOptimizationDiscoveryUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function registryFromBody(body: Record<string, unknown>): OptimizationOpportunityRegistry {
  return (body.registry as OptimizationOpportunityRegistry | undefined) ?? discoverOptimizationOpportunities(body as OptimizationDiscoveryInput);
}

export function contractResponse() { return getOptimizationOpportunityDiscovery(); }
export async function discoverRequest(request: Request) { return discoverOptimizationOpportunities((await readBody(request)) as OptimizationDiscoveryInput); }
export async function baselinesRequest(request: Request) { return listPerformanceBaselines((await readBody(request)) as OptimizationDiscoveryInput); }
export async function evidenceRequest(request: Request) { return listDiscoveryEvidence((await readBody(request)) as OptimizationDiscoveryInput); }
export async function registryRequest(request: Request) { return discoverOptimizationOpportunities((await readBody(request)) as OptimizationDiscoveryInput); }
export async function validateRequest(request: Request) { return validateOptimizationDiscovery(registryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildOptimizationDiscoveryObservabilitySurface();
  return buildOptimizationDiscoveryObservabilitySurface(registryFromBody(await readBody(request)));
}
