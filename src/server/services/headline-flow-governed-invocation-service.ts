import { AppError } from "@/src/server/api/errors";
import { prisma } from "@/src/server/db/prisma";
import { authenticateApplicationCredential } from "@/src/server/services/application-identity-service";

/** Admission only: Headline Flow remains responsible for its own future domain service. */
export async function admitHeadlineDraftInvocation(token: string, resource: string) {
  const identity = await authenticateApplicationCredential(token);
  if (!identity) throw new AppError(401, "application_credential_invalid", "Application credential is invalid or inactive.");
  const application = await prisma.registeredApplication.findFirst({ where: { id: identity.applicationId, workspaceId: identity.workspaceId, slug: "headline-flow", lifecycleState: "ACTIVE" } });
  if (!application) throw new AppError(403, "headline_flow_integration_required", "Credential is not registered for active Headline Flow.");
  const grant = await prisma.applicationCapabilityGrant.findFirst({ where: { principalId: identity.principalId, status: "ACTIVE", capability: { applicationId: application.id, capabilityKey: "headline.draft" } } });
  const scope = grant?.scope as { resources?: string[]; operations?: string[] } | undefined;
  if (!grant || !scope?.operations?.includes("headline.draft") || !scope.resources?.includes(resource)) {
    throw new AppError(403, "capability_scope_denied", "Requested Headline Flow draft is outside the approved grant scope.");
  }
  return { admitted: true as const, workspaceId: identity.workspaceId, applicationId: application.id, principalId: identity.principalId, grantId: grant.id, operation: "headline.draft" as const, resource, mode: "SANDBOX_HANDOFF" as const };
}
