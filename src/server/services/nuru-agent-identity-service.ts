import { z } from "zod";
import { nuruPermissionActions, type NuruPermissionAction } from "@/src/nuru/permissions";

export const nuruAgentStatuses = ["ACTIVE", "PAUSED", "RETIRED"] as const;
export const nuruAgentIdentitySchema = z.object({
  agentId: z.enum(["nuru.discovery.v1", "nuru.context.v1", "nuru.connection.v1", "nuru.quality.v1", "nuru.curator.v1"]),
  agentType: z.enum(["DISCOVERY", "CONTEXT", "CONNECTION", "QUALITY", "CURATOR"]),
  role: z.string().trim().min(1),
  version: z.string().trim().min(1),
  model: z.string().trim().min(1),
  permissions: z.array(z.enum(nuruPermissionActions)).min(1),
  tools: z.array(z.string().trim().min(1)).min(1),
  policyProfile: z.string().trim().min(1),
  promptVersion: z.string().trim().min(1),
  status: z.enum(nuruAgentStatuses),
});
export type NuruAgentIdentity = z.infer<typeof nuruAgentIdentitySchema>;

/** Versioned, reviewable identities are the authoritative capability profiles for Nuru agents. */
export const nuruAgentIdentities: readonly NuruAgentIdentity[] = [
  { agentId: "nuru.discovery.v1", agentType: "DISCOVERY", role: "Discovery Agent", version: "v1", model: "local-runtime-v1", permissions: ["READ", "SEARCH", "DISCOVER", "PROPOSE"], tools: ["search_knowledge", "submit_discovery"], policyProfile: "nuru-v1-discovery", promptVersion: "nuru-v1", status: "ACTIVE" },
  { agentId: "nuru.context.v1", agentType: "CONTEXT", role: "Context Agent", version: "v1", model: "local-runtime-v1", permissions: ["READ", "SEARCH", "CLASSIFY", "PROPOSE"], tools: ["get_item", "get_metadata", "submit_context_assessment"], policyProfile: "nuru-v1-context", promptVersion: "nuru-v1", status: "ACTIVE" },
  { agentId: "nuru.connection.v1", agentType: "CONNECTION", role: "Connection Agent", version: "v1", model: "local-runtime-v1", permissions: ["READ", "SEARCH", "CONNECT", "PROPOSE"], tools: ["search_knowledge", "detect_duplicates", "find_cross_project_connections", "find_similar", "find_relationships", "get_history", "submit_connection_proposal"], policyProfile: "nuru-v1-connection", promptVersion: "nuru-v1", status: "ACTIVE" },
  { agentId: "nuru.quality.v1", agentType: "QUALITY", role: "Quality Agent", version: "v1", model: "local-runtime-v1", permissions: ["READ", "SEARCH", "CLASSIFY", "PROPOSE"], tools: ["get_item", "get_metadata", "search_knowledge", "detect_duplicates", "detect_contradictions", "submit_quality_assessment"], policyProfile: "nuru-v1-quality", promptVersion: "nuru-v1", status: "ACTIVE" },
  { agentId: "nuru.curator.v1", agentType: "CURATOR", role: "Nuru Curator", version: "v1", model: "local-runtime-v1", permissions: ["READ", "SEARCH", "PROPOSE"], tools: ["get_item", "get_curator_memory", "submit_proposal"], policyProfile: "nuru-v1-curator", promptVersion: "nuru-v1", status: "ACTIVE" },
];

export function getNuruAgentIdentity(agentId: string) { return nuruAgentIdentities.find((identity) => identity.agentId === agentId); }
export function listNuruAgentIdentities() { return nuruAgentIdentities; }
export function agentIdentityCapabilities(agentId: string): readonly NuruPermissionAction[] { return getNuruAgentIdentity(agentId)?.permissions ?? []; }
