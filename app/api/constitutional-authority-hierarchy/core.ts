import { getConstitutionalAuthorityHierarchyContract, runConstitutionalAuthorityHierarchy, validateConstitutionalAuthorityHierarchy } from "@/services/constitutional-authority-hierarchy";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { AuthorityHierarchyResult, AuthorityInput } from "@/types/constitutional-authority-hierarchy";

export async function requireAuthorityHierarchyUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): AuthorityInput { return body as AuthorityInput; }
function resultFromBody(body: Record<string, unknown>): AuthorityHierarchyResult { return (body.result as AuthorityHierarchyResult | undefined) ?? runConstitutionalAuthorityHierarchy(inputFromBody(body)); }

export function contractResponse() { return getConstitutionalAuthorityHierarchyContract(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runConstitutionalAuthorityHierarchy(); }
export async function hierarchyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConstitutionalAuthorityHierarchy(); return { hierarchy: result.hierarchy }; }
export async function resolutionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConstitutionalAuthorityHierarchy(); return { resolution: result.resolution }; }
export async function ceilingsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConstitutionalAuthorityHierarchy(); return { ceilings: result.ceilings }; }
export async function inheritanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConstitutionalAuthorityHierarchy(); return { inheritance: result.inheritance }; }
export async function advisoryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConstitutionalAuthorityHierarchy(); return { advisory_boundary: result.advisory_boundary }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConstitutionalAuthorityHierarchy(); return { replay: result.replay, replay_hash: result.replay_hash }; }
export async function explainRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConstitutionalAuthorityHierarchy(); return { explainability: result.explainability }; }
export async function integrityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConstitutionalAuthorityHierarchy(); return { integrity: result.integrity, integrity_hash: result.integrity_hash }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConstitutionalAuthorityHierarchy(); return { registry: result.registry }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConstitutionalAuthorityHierarchy(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function validateRequest(request: Request) { return validateConstitutionalAuthorityHierarchy(resultFromBody(await readBody(request))); }
