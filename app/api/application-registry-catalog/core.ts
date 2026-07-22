import {
  getApplicationRegistryCatalogBundle,
  runApplicationRegistryCatalog,
  validateApplicationRegistryCatalog,
} from "@/services/application-registry-catalog";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ApplicationRegistryCatalogResult, ApplicationRegistryInput } from "@/types/application-registry-catalog";

export async function requireApplicationRegistryCatalogUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ApplicationRegistryInput { return body as ApplicationRegistryInput; }
function resultFromBody(body: Record<string, unknown>): ApplicationRegistryCatalogResult { return (body.result as ApplicationRegistryCatalogResult | undefined) ?? runApplicationRegistryCatalog(inputFromBody(body)); }

export function contractResponse() { return getApplicationRegistryCatalogBundle(); }
export async function validateRequest(request: Request) { return validateApplicationRegistryCatalog(resultFromBody(await readBody(request))); }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationRegistryCatalog(); return { registry: result.registry }; }
export async function identityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationRegistryCatalog(); return { identities: result.registry.records }; }
export async function metadataRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationRegistryCatalog(); return { metadata_repository: result.metadata_repository }; }
export async function discoveryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationRegistryCatalog(); return { discovery_index: result.discovery_index }; }
export async function catalogRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationRegistryCatalog(); return { catalog: result.catalog }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationRegistryCatalog(); return { lineage: result.lineage }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationRegistryCatalog(); return { governance: result.governance }; }
export async function auditRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationRegistryCatalog(); return { audit_evidence: result.audit_evidence }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationRegistryCatalog(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
