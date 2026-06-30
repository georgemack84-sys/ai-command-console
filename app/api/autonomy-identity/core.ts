import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildAutonomyIdentityObservabilitySurface,
  buildAutonomyIdentityRegistry,
  computeAutonomyIdentityHash,
  computeAutonomyIdentityIntegrityHash,
  generateAutonomyIdentity,
  getAutonomyIdentityFramework,
  getAutonomyIdentityVersionPolicy,
  reconstructAutonomyLineage,
  validateAutonomyIdentity,
} from "@/services/autonomy-identity";
import type { AutonomyIdentityRecord, AutonomyIdentityScenario } from "@/types/autonomy-identity";

export async function requireAutonomyIdentityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function identityFromBody(body: Record<string, unknown>) {
  return (body.identity as AutonomyIdentityRecord | undefined) ?? generateAutonomyIdentity({ scenario: body.scenario as AutonomyIdentityScenario | undefined });
}

export function getAutonomyIdentityResponse() {
  return getAutonomyIdentityFramework();
}

export async function generateAutonomyIdentityRequest(request: Request) {
  const body = await readBody(request);
  return generateAutonomyIdentity({ scenario: body.scenario as AutonomyIdentityScenario | undefined });
}

export async function validateAutonomyIdentityRequest(request: Request) {
  const body = await readBody(request);
  return validateAutonomyIdentity(identityFromBody(body), { registry: body.registry as readonly AutonomyIdentityRecord[] | undefined });
}

export async function registryAutonomyIdentityRequest(request: Request) {
  const body = await readBody(request);
  const identities = (body.identities as readonly AutonomyIdentityRecord[] | undefined) ?? [identityFromBody(body)];
  return buildAutonomyIdentityRegistry(identities);
}

export async function lineageAutonomyIdentityRequest(request: Request) {
  const body = await readBody(request);
  const identity = identityFromBody(body);
  return reconstructAutonomyLineage(identity, (body.registry as readonly AutonomyIdentityRecord[] | undefined) ?? [identity]);
}

export async function hashAutonomyIdentityRequest(request: Request) {
  const body = await readBody(request);
  const identity = identityFromBody(body);
  return {
    autonomy_identity_hash: computeAutonomyIdentityHash(identity.primary),
    autonomy_identity_integrity_hash: computeAutonomyIdentityIntegrityHash(identity.primary),
  };
}

export function versionAutonomyIdentityResponse() {
  return getAutonomyIdentityVersionPolicy();
}

export async function inspectAutonomyIdentityRequest(request?: Request) {
  if (!request) return buildAutonomyIdentityObservabilitySurface();
  const body = await readBody(request);
  const identity = identityFromBody(body);
  return buildAutonomyIdentityObservabilitySurface(identity, (body.registry as readonly AutonomyIdentityRecord[] | undefined) ?? [identity]);
}
