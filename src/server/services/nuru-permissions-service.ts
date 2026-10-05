import { z } from "zod";
import { agentIdentityCapabilities } from "@/src/server/services/nuru-agent-identity-service";
export { nuruPermissionActions, nuruResources, type NuruPermissionAction } from "@/src/nuru/permissions";
import { nuruPermissionActions, nuruResources, type NuruPermissionAction } from "@/src/nuru/permissions";

export const permissionRequestSchema = z.object({
  subject: z.string().trim().min(1),
  resource: z.enum(nuruResources),
  action: z.enum(nuruPermissionActions),
  context: z.object({ project: z.string().trim().max(120).optional(), correlationId: z.string().trim().min(1), purpose: z.string().trim().min(3).max(500) }),
});
export type PermissionRequest = z.infer<typeof permissionRequestSchema>;
export type PermissionDecision = { allowed: boolean; reason: string; subject: string; resource: string; action: NuruPermissionAction; correlationId: string };

function denied(request: PermissionRequest, reason: string): PermissionDecision {
  return { allowed: false, reason, subject: request.subject, resource: request.resource, action: request.action, correlationId: request.context.correlationId };
}

/** Deterministic, fail-closed authorization. Only governance may invoke durable archive actions. */
export const NuruPermissionsService = {
  authorize(rawRequest: PermissionRequest): PermissionDecision {
    const request = permissionRequestSchema.parse(rawRequest);
    if (request.subject === "nuru.governance.v1") return ["ARCHIVE", "SUPERSEDE"].includes(request.action)
      ? { allowed: true, reason: "Governance may authorize approved durable curation actions.", subject: request.subject, resource: request.resource, action: request.action, correlationId: request.context.correlationId }
      : denied(request, "Governance does not grant this action.");
    if (request.subject.startsWith("nuru.") && ["ARCHIVE", "SUPERSEDE", "DELETE", "ADMINISTER"].includes(request.action)) return denied(request, "Agents cannot make durable, destructive, or administrative mutations.");
    const capabilities = agentIdentityCapabilities(request.subject);
    if (capabilities.length) return capabilities.includes(request.action)
      ? { allowed: true, reason: "Allowed by the subject’s least-privilege agent policy.", subject: request.subject, resource: request.resource, action: request.action, correlationId: request.context.correlationId }
      : denied(request, "This action is not granted to the agent’s least-privilege policy.");
    return denied(request, "Unknown subject; permissions fail closed.");
  },

  capabilities(subject: string) { return agentIdentityCapabilities(subject); },
};
