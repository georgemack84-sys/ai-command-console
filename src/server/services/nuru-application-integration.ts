import { prisma } from "@/src/server/db/prisma";
import { declareApplicationCapability } from "@/src/server/services/application-capability-service";
import { registerApplication } from "@/src/server/services/application-registry-service";

/**
 * Phase 5.10 reference contract. Nuru remains independently deployable and
 * keeps all knowledge/evidence domain records in its own bounded context.
 */
export const NURU_APPLICATION_REGISTRATION = {
  slug: "nuru",
  displayName: "Nuru",
  description: "Knowledge, search, and evidence application.",
  ownerApplicationContact: "nuru@proprium.local",
  supportedContractVersions: ["1.0"],
  metadata: { domain: "knowledge", integration: "reference" },
} as const;

export const NURU_REFERENCE_CAPABILITIES = [
  { capabilityKey: "knowledge.search", version: "1.0", description: "Search Nuru knowledge and evidence without modifying domain records.", inputSchema: { query: { type: "string", required: true } }, requiredPermissions: ["knowledge.read"], constraints: ["read-only", "workspace-scoped"] },
  { capabilityKey: "evidence.retrieve", version: "1.0", description: "Retrieve evidence by reference without mutating Nuru records.", inputSchema: { evidenceId: { type: "string", required: true } }, requiredPermissions: ["evidence.read"], constraints: ["read-only", "workspace-scoped"] },
] as const;

/** Headline Flow is a separate publishing-domain reference application. */
export const HEADLINE_FLOW_APPLICATION_REGISTRATION = {
  slug: "headline-flow",
  displayName: "Headline Flow",
  description: "Editorial headline drafting and publishing workflow application.",
  ownerApplicationContact: "headline-flow@proprium.local",
  supportedContractVersions: ["1.0"],
  metadata: { domain: "editorial", integration: "reference" },
} as const;

export const HEADLINE_FLOW_REFERENCE_CAPABILITIES = [
  { capabilityKey: "headline.draft", version: "1.0", description: "Create a draft headline from approved evidence without publishing it.", inputSchema: { evidence: { type: "object", required: true } }, requiredPermissions: ["headline.draft"], constraints: ["approval-gated", "workspace-scoped", "no-publish"] },
] as const;

/** Idempotently provisions only platform metadata/contracts; it never creates credentials or grants. */
export async function provisionNuruReferenceIntegration(workspaceId: string, actorId: string) {
  const registration = await registerApplication(workspaceId, actorId, NURU_APPLICATION_REGISTRATION);
  const applicationId = registration.application.applicationId;
  for (const capability of NURU_REFERENCE_CAPABILITIES) {
    const existing = await prisma.applicationCapability.findFirst({ where: { applicationId, capabilityKey: capability.capabilityKey, version: capability.version } });
    if (!existing) await declareApplicationCapability(workspaceId, applicationId, actorId, capability);
  }
  const capabilities = await prisma.applicationCapability.findMany({ where: { applicationId }, orderBy: { capabilityKey: "asc" } });
  return { application: registration.application, registered: registration.created, capabilities, credentialsCreated: false, grantsCreated: false };
}

/** Registers the reference contract only. Activation, credentials, and grants stay explicit. */
export async function provisionHeadlineFlowReferenceIntegration(workspaceId: string, actorId: string) {
  const registration = await registerApplication(workspaceId, actorId, HEADLINE_FLOW_APPLICATION_REGISTRATION);
  const applicationId = registration.application.applicationId;
  for (const capability of HEADLINE_FLOW_REFERENCE_CAPABILITIES) {
    const existing = await prisma.applicationCapability.findFirst({ where: { applicationId, capabilityKey: capability.capabilityKey, version: capability.version } });
    if (!existing) await declareApplicationCapability(workspaceId, applicationId, actorId, capability);
  }
  const capabilities = await prisma.applicationCapability.findMany({ where: { applicationId }, orderBy: { capabilityKey: "asc" } });
  return { application: registration.application, registered: registration.created, capabilities, activationRequired: registration.application.lifecycleState !== "ACTIVE", credentialsCreated: false, grantsCreated: false };
}
