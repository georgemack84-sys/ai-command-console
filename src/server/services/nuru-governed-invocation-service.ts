import { AppError } from "@/src/server/api/errors";
import { authenticateApplicationCredential } from "@/src/server/services/application-identity-service";
import { prisma } from "@/src/server/db/prisma";

const capabilityForOperation = { "knowledge.search": "knowledge.search", "evidence.retrieve": "evidence.retrieve" } as const;

/** Admission only: Nuru owns the eventual read implementation and domain data. */
export async function admitNuruReadInvocation(token: string, operation: keyof typeof capabilityForOperation, resource: string) {
  const identity = await authenticateApplicationCredential(token);
  if (!identity) throw new AppError(401, "application_credential_invalid", "Application credential is invalid or inactive.");
  const app = await prisma.registeredApplication.findFirst({ where: { id: identity.applicationId, workspaceId: identity.workspaceId, slug: "nuru" } });
  if (!app) throw new AppError(403, "nuru_integration_required", "Credential is not registered for Nuru.");
  const grant = await prisma.applicationCapabilityGrant.findFirst({ where: { principalId: identity.principalId, status: "ACTIVE", capability: { applicationId: app.id, capabilityKey: capabilityForOperation[operation] } } });
  if (!grant) throw new AppError(403, "capability_grant_required", "An active Nuru capability grant is required.");
  const scope = grant.scope as { resources?: string[]; operations?: string[] };
  if (!scope.operations?.includes(operation) || !scope.resources?.includes(resource)) throw new AppError(403, "capability_scope_denied", "Requested Nuru operation is outside the approved grant scope.");
  return { admitted: true as const, workspaceId: identity.workspaceId, applicationId: app.id, principalId: identity.principalId, grantId: grant.id, operation, resource, mode: "READ_ONLY_HANDOFF" as const };
}
