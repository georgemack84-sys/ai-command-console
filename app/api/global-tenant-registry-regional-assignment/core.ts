import { getGlobalTenantRegistryRegionalAssignmentBundle, runGlobalTenantRegistryRegionalAssignment, validateGlobalTenantRegistryRegionalAssignment } from "@/services/global-tenant-registry-regional-assignment";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { GlobalTenantRegistryRegionalAssignmentInput, GlobalTenantRegistryRegionalAssignmentResult } from "@/types/global-tenant-registry-regional-assignment";

export async function requireGlobalTenantRegistryRegionalAssignmentUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): GlobalTenantRegistryRegionalAssignmentInput { return body as GlobalTenantRegistryRegionalAssignmentInput; }
function resultFromBody(body: Record<string, unknown>): GlobalTenantRegistryRegionalAssignmentResult { return (body.result as GlobalTenantRegistryRegionalAssignmentResult | undefined) ?? runGlobalTenantRegistryRegionalAssignment(inputFromBody(body)); }

export function contractResponse() { return getGlobalTenantRegistryRegionalAssignmentBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runGlobalTenantRegistryRegionalAssignment(); }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runGlobalTenantRegistryRegionalAssignment(); return { global_registry: result.global_registry, regional_assignment_registry: result.regional_assignment_registry }; }
export async function mutationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runGlobalTenantRegistryRegionalAssignment(); return { mutation_envelope: result.mutation_envelope, mutation_validation: result.mutation_validation }; }
export async function authorityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runGlobalTenantRegistryRegionalAssignment(); return { authority_validation: result.authority_validation, conflict_resolver: result.conflict_resolver }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runGlobalTenantRegistryRegionalAssignment(); return { assignment_ledger: result.assignment_ledger }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runGlobalTenantRegistryRegionalAssignment(); return { replay_service: result.replay_service, integrity_validator: result.integrity_validator }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runGlobalTenantRegistryRegionalAssignment(); return { certification_package: result.certification_package, certification_tests: result.certification_tests, dashboard: result.dashboard, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateGlobalTenantRegistryRegionalAssignment(resultFromBody(await readBody(request))); }
