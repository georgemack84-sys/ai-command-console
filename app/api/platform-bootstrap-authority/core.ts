import { getPlatformBootstrapAuthorityBundle, runPlatformBootstrapAuthority, validatePlatformBootstrapAuthority } from "@/services/platform-bootstrap-authority";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { BootstrapInput, BootstrapResult } from "@/types/platform-bootstrap-authority";

export async function requireBootstrapUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): BootstrapInput { return body as BootstrapInput; }
function resultFromBody(body: Record<string, unknown>): BootstrapResult { return (body.result as BootstrapResult | undefined) ?? runPlatformBootstrapAuthority(inputFromBody(body)); }
export function contractResponse() { return getPlatformBootstrapAuthorityBundle(); }
export async function validateRequest(request: Request) { return validatePlatformBootstrapAuthority(resultFromBody(await readBody(request))); }
export async function architectureRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformBootstrapAuthority(); return { architecture: result.architecture }; }
export async function rootTrustRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformBootstrapAuthority(); return { root_of_trust: result.root_of_trust }; }
export async function certificateAuthorityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformBootstrapAuthority(); return { certificate_authority: result.certificate_authority }; }
export async function identityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformBootstrapAuthority(); return { identity_registry: result.identity_registry }; }
export async function authorizationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformBootstrapAuthority(); return { authorization: result.authorization }; }
export async function rolesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformBootstrapAuthority(); return { role_permission_matrix: result.role_permission_matrix }; }
export async function namespaceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformBootstrapAuthority(); return { namespace_registry: result.namespace_registry }; }
export async function tenantRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformBootstrapAuthority(); return { tenant: result.tenant }; }
export async function auditRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformBootstrapAuthority(); return { audit_ledger: result.audit_ledger }; }
export async function securityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformBootstrapAuthority(); return { security_report: result.security_report }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformBootstrapAuthority(); return { validation_report: result.validation_report, qualification_report: result.qualification_report, readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
