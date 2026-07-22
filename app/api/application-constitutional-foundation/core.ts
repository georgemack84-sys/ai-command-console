import {
  getApplicationConstitutionalFoundationBundle,
  runApplicationConstitutionalFoundation,
  validateApplicationConstitutionalFoundation,
} from "@/services/application-constitutional-foundation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ApplicationFoundationInput, ApplicationFoundationResult } from "@/types/application-constitutional-foundation";

export async function requireApplicationFoundationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ApplicationFoundationInput { return body as ApplicationFoundationInput; }
function resultFromBody(body: Record<string, unknown>): ApplicationFoundationResult { return (body.result as ApplicationFoundationResult | undefined) ?? runApplicationConstitutionalFoundation(inputFromBody(body)); }

export function contractResponse() { return getApplicationConstitutionalFoundationBundle(); }
export async function validateRequest(request: Request) { return validateApplicationConstitutionalFoundation(resultFromBody(await readBody(request))); }
export async function doctrineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationConstitutionalFoundation(); return { doctrine: result.doctrine }; }
export async function inheritanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationConstitutionalFoundation(); return { inheritance: result.inheritance }; }
export async function boundariesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationConstitutionalFoundation(); return { boundary_model: result.boundary_model }; }
export async function ownershipRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationConstitutionalFoundation(); return { ownership_registry: result.ownership_registry }; }
export async function taxonomyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationConstitutionalFoundation(); return { taxonomy: result.taxonomy }; }
export async function constraintsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationConstitutionalFoundation(); return { constraints: result.constraints }; }
export async function namespaceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationConstitutionalFoundation(); return { namespace_governance: result.namespace_governance }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationConstitutionalFoundation(); return { evidence: result.evidence }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationConstitutionalFoundation(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
