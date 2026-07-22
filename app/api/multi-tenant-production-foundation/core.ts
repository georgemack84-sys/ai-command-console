import { getMultiTenantProductionFoundationBundle, runMultiTenantProductionFoundation, validateMultiTenantProductionFoundation } from "@/services/multi-tenant-production-foundation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { MultiTenantProductionFoundationInput, MultiTenantProductionFoundationResult } from "@/types/multi-tenant-production-foundation";

export async function requireMultiTenantProductionFoundationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): MultiTenantProductionFoundationInput { return body as MultiTenantProductionFoundationInput; }
function resultFromBody(body: Record<string, unknown>): MultiTenantProductionFoundationResult { return (body.result as MultiTenantProductionFoundationResult | undefined) ?? runMultiTenantProductionFoundation(inputFromBody(body)); }

export function contractResponse() { return getMultiTenantProductionFoundationBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runMultiTenantProductionFoundation(); }
export async function contractRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMultiTenantProductionFoundation(); return { contract: result.contract, boundary_contract: result.boundary_contract }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMultiTenantProductionFoundation(); return { lifecycle: result.lifecycle }; }
export async function registriesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMultiTenantProductionFoundation(); return { architecture_registry: result.architecture_registry, tenant_scale_registry: result.tenant_scale_registry }; }
export async function authorityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMultiTenantProductionFoundation(); return { responsibility_model: result.responsibility_model, scaling_authority_model: result.scaling_authority_model }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMultiTenantProductionFoundation(); return { certification_package: result.certification_package, certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateMultiTenantProductionFoundation(resultFromBody(await readBody(request))); }
