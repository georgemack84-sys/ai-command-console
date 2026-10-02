import { z } from "zod";
import { getNuruAgentIdentity } from "@/src/server/services/nuru-agent-identity-service";
export const nuruVersionSnapshotSchema = z.object({ agent: z.object({ id: z.string(), version: z.string() }), promptVersion: z.string(), policyVersion: z.string(), knowledgeSchemaVersion: z.string(), workflowVersion: z.string(), modelRoutingVersion: z.string(), toolRegistryVersion: z.string(), curationRulesVersion: z.string() });
export type NuruVersionSnapshot = z.infer<typeof nuruVersionSnapshotSchema>;
export const nuruVersionManifest = { knowledgeSchemaVersion: "knowledge-schema-v1.5", workflowVersion: "workflow-templates-v1.0", modelRoutingVersion: "model-routing-v1.0", toolRegistryVersion: "tool-registry-v1.0", curationRulesVersion: "curation-rules-v2.1" } as const;
/** Immutable release manifest; agents cannot mutate versions. */
export const NuruVersionRegistry = { snapshot(agentId: string): NuruVersionSnapshot { const agent = getNuruAgentIdentity(agentId); if (!agent) throw new Error(`Cannot version unknown Nuru agent: ${agentId}`); return nuruVersionSnapshotSchema.parse({ agent: { id: agent.agentId, version: agent.version }, promptVersion: agent.promptVersion, policyVersion: "nuru-governance-v1", ...nuruVersionManifest }); } };
