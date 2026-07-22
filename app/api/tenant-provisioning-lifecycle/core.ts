import { getTenantProvisioningLifecycleBundle, runTenantProvisioningLifecycle, validateTenantProvisioningLifecycle } from "@/services/tenant-provisioning-lifecycle";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TenantProvisioningLifecycleInput, TenantProvisioningLifecycleResult } from "@/types/tenant-provisioning-lifecycle";

export async function requireTenantProvisioningLifecycleUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TenantProvisioningLifecycleInput { return body as TenantProvisioningLifecycleInput; }
function resultFromBody(body: Record<string, unknown>): TenantProvisioningLifecycleResult { return (body.result as TenantProvisioningLifecycleResult | undefined) ?? runTenantProvisioningLifecycle(inputFromBody(body)); }

export function contractResponse() { return getTenantProvisioningLifecycleBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runTenantProvisioningLifecycle(); }
export async function provisioningRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTenantProvisioningLifecycle(); return { provisioning_engine: result.provisioning_engine, configuration_service: result.configuration_service }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTenantProvisioningLifecycle(); return { qualification_service: result.qualification_service, dashboard: result.dashboard }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTenantProvisioningLifecycle(); return { lifecycle_records: result.lifecycle_records, transition_validation: result.transition_validation, lifecycle_registry: result.lifecycle_registry }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTenantProvisioningLifecycle(); return { replay_service: result.replay_service, audit_ledger: result.audit_ledger }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTenantProvisioningLifecycle(); return { certification_package: result.certification_package, certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateTenantProvisioningLifecycle(resultFromBody(await readBody(request))); }
