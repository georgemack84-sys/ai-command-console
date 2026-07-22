import {
  getCollaborationFederationBundle,
  runCollaborationFederation,
  validateCollaborationFederation,
} from "@/services/caf-collaboration-federation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { CollaborationFederationInput, CollaborationFederationResult } from "@/types/caf-collaboration-federation";

export async function requireCollaborationFederationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): CollaborationFederationInput { return body as CollaborationFederationInput; }
function resultFromBody(body: Record<string, unknown>): CollaborationFederationResult { return (body.result as CollaborationFederationResult | undefined) ?? runCollaborationFederation(inputFromBody(body)); }

export function contractResponse() { return getCollaborationFederationBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runCollaborationFederation(); }
export async function validateRequest(request: Request) { return validateCollaborationFederation(resultFromBody(await readBody(request))); }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCollaborationFederation(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function collaborationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCollaborationFederation(); return { collaboration: result.collaboration, shared_context: result.shared_context }; }
export async function delegationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCollaborationFederation(); return { delegation: result.delegation, negotiation: result.negotiation }; }
export async function federationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCollaborationFederation(); return { federation: result.federation, interoperability: result.interoperability, trust_security: result.trust_security }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCollaborationFederation(); return { governance: result.governance, evidence: result.evidence, replay_validation: result.replay_validation, observability: result.observability }; }
