import {
  getApplicationIdentityTenancyNamespaceBundle,
  runApplicationIdentityTenancyNamespace,
  validateApplicationIdentityTenancyNamespace,
} from "@/services/application-identity-tenancy-namespace";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ApplicationIdentityInput, ApplicationIdentityTenancyNamespaceResult } from "@/types/application-identity-tenancy-namespace";

export async function requireApplicationIdentityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ApplicationIdentityInput { return body as ApplicationIdentityInput; }
function resultFromBody(body: Record<string, unknown>): ApplicationIdentityTenancyNamespaceResult { return (body.result as ApplicationIdentityTenancyNamespaceResult | undefined) ?? runApplicationIdentityTenancyNamespace(inputFromBody(body)); }

export function contractResponse() { return getApplicationIdentityTenancyNamespaceBundle(); }
export async function validateRequest(request: Request) { return validateApplicationIdentityTenancyNamespace(resultFromBody(await readBody(request))); }
export async function identityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationIdentityTenancyNamespace(); return { identity_record: result.identity_record, identity_lifecycle: result.identity_lifecycle }; }
export async function namespaceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationIdentityTenancyNamespace(); return { namespace_record: result.namespace_record }; }
export async function ownershipRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationIdentityTenancyNamespace(); return { ownership_record: result.ownership_record }; }
export async function tenantBoundaryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationIdentityTenancyNamespace(); return { tenant_integration: result.tenant_integration }; }
export async function validationReportRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationIdentityTenancyNamespace(); return { validation_report: result.validation_report }; }
export async function synchronizationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationIdentityTenancyNamespace(); return { registry_synchronization: result.registry_synchronization }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationIdentityTenancyNamespace(); return { evidence: result.evidence }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationIdentityTenancyNamespace(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
