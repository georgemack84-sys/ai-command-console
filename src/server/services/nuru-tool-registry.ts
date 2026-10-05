import { z } from "zod";
import { sourceSchema } from "@/src/nuru/domain";
import { NuruAgentRecordService } from "@/src/server/services/nuru-agent-record-service";
import { NuruArchiveService } from "@/src/server/services/nuru-archive-service";
import { NuruAuditService } from "@/src/server/services/nuru-audit-service";
import { nuruEmbeddingsService, type NuruEmbeddingsService } from "@/src/server/services/nuru-embeddings-service";
import { getMetadata } from "@/src/server/services/nuru-metadata-service";
import { NuruPermissionsService, type NuruPermissionAction } from "@/src/server/services/nuru-permissions-service";
import { NuruSearchService } from "@/src/server/services/nuru-search-service";
import { nuruDuplicateService, type NuruDuplicateService } from "@/src/server/services/nuru-duplicate-service";
import { NuruContradictionService } from "@/src/server/services/nuru-contradiction-service";
import { nuruCrossProjectConnectionService, type NuruCrossProjectConnectionService } from "@/src/server/services/nuru-cross-project-connection-service";
import { NuruCuratorMemoryService, curatorMemoryPacketSchema } from "@/src/server/services/nuru-curator-memory-service";

type NuruToolResource = "knowledge" | "metadata" | "relationships" | "proposals" | "archive" | "permissions" | "audit" | "embeddings";
type AnySchema = z.ZodType<unknown>;

export type NuruToolDefinition = {
  name: string;
  description: string;
  resource: NuruToolResource;
  requiredPermission: NuruPermissionAction;
  inputSchema: AnySchema;
  outputSchema: AnySchema;
  rateLimit: { maxInvocations: number; windowMs: number };
  audited: boolean;
};

export const toolInvocationSchema = z.object({
  agentId: z.string().trim().min(1),
  runId: z.string().trim().min(1),
  correlationId: z.string().trim().min(1),
  objective: z.string().trim().min(3).max(2_000),
});
export type ToolInvocation = z.infer<typeof toolInvocationSchema>;

const itemIdSchema = z.object({ itemId: z.string().trim().min(1) });
const findSimilarInputSchema = itemIdSchema.extend({ content: z.string().trim().min(1).max(20_000), limit: z.number().int().min(1).max(100).default(10), threshold: z.number().min(-1).max(1).default(0) });
const searchInputSchema = z.object({ query: z.string().trim().max(500).optional(), project: z.string().trim().max(120).optional(), type: z.string().trim().max(160).optional(), limit: z.number().int().min(1).max(100).default(20) });
const duplicateInputSchema = z.object({ itemId: z.string().min(1), title: z.string().min(1), content: z.string().min(1), project: z.string().optional(), contentType: z.string().optional(), metadata: z.record(z.string(), z.unknown()).default({}), limit: z.number().int().min(1).max(50).default(20) });
const contradictionInputSchema = z.object({ itemId: z.string().min(1), title: z.string().min(1), content: z.string().min(1), project: z.string().optional(), limit: z.number().int().min(1).max(50).default(20) });
const crossProjectInputSchema = z.object({ itemId: z.string().min(1), title: z.string().min(1), content: z.string().min(1), primaryProject: z.string().min(1), relatedProjects: z.array(z.string()).default([]), limit: z.number().int().min(1).max(20).default(10) });
const curatorMemoryInputSchema = z.object({ project: z.string().trim().min(1).max(120) });
const contextSubmissionSchema = z.object({ candidateId: z.string().min(1), project: z.string().optional(), relatedProjects: z.array(z.string()).default([]), topic: z.string().min(1), artifactType: z.string().min(1), scope: z.string().min(1), sourceContext: z.string().min(1), likelyPurpose: z.string().min(1), dependencies: z.array(z.string()), applicableSystem: z.string().optional(), historicalContext: z.string().optional(), relatedComponents: z.array(z.string()), confidence: z.number().min(0).max(1) });
const connectionSubmissionSchema = z.object({ sourceItemId: z.string().min(1), targetItemId: z.string().min(1), relationshipType: z.string().min(1), confidence: z.number().min(0).max(1), evidence: z.string().min(1), status: z.literal("PROPOSED") });
const qualitySubmissionSchema = z.object({ itemId: z.string().min(1), status: z.string().min(1), sourceKnown: z.boolean(), provenanceAvailable: z.boolean(), duplicateState: z.string().min(1), conflictDetected: z.boolean(), contextAccurate: z.boolean(), relationshipsJustified: z.boolean(), evidenceSufficient: z.boolean(), confidence: z.number().min(0).max(1), warnings: z.array(z.string()) });
const discoverySubmissionSchema = z.object({ title: z.string().min(1), content: z.string().min(1), source: sourceSchema, reasonDiscovered: z.string().min(1), initialType: z.string().min(1), relevanceScore: z.number().int().min(0).max(100), confidence: z.number().min(0).max(1), status: z.literal("CANDIDATE") });

const definitions = [
  { name: "search_knowledge", description: "Retrieve deterministic knowledge candidates.", resource: "knowledge", requiredPermission: "SEARCH", inputSchema: searchInputSchema, outputSchema: z.array(z.unknown()), rateLimit: { maxInvocations: 60, windowMs: 60_000 }, audited: true },
  { name: "detect_duplicates", description: "Compare hashes, metadata, and embeddings for duplicate evidence.", resource: "knowledge", requiredPermission: "SEARCH", inputSchema: duplicateInputSchema, outputSchema: z.unknown(), rateLimit: { maxInvocations: 30, windowMs: 60_000 }, audited: true },
  { name: "detect_contradictions", description: "Find competing claims and required investigation questions.", resource: "knowledge", requiredPermission: "SEARCH", inputSchema: contradictionInputSchema, outputSchema: z.array(z.unknown()), rateLimit: { maxInvocations: 30, windowMs: 60_000 }, audited: true },
  { name: "find_cross_project_connections", description: "Retrieve related knowledge from other projects.", resource: "knowledge", requiredPermission: "SEARCH", inputSchema: crossProjectInputSchema, outputSchema: z.array(z.unknown()), rateLimit: { maxInvocations: 30, windowMs: 60_000 }, audited: true },
  { name: "get_item", description: "Retrieve one archived knowledge item by identifier.", resource: "knowledge", requiredPermission: "READ", inputSchema: itemIdSchema, outputSchema: z.unknown().nullable(), rateLimit: { maxInvocations: 120, windowMs: 60_000 }, audited: true },
  { name: "get_curator_memory", description: "Retrieve a bounded, read-only Curator context packet.", resource: "knowledge", requiredPermission: "READ", inputSchema: curatorMemoryInputSchema, outputSchema: curatorMemoryPacketSchema, rateLimit: { maxInvocations: 30, windowMs: 60_000 }, audited: true },
  { name: "get_metadata", description: "Retrieve normalized metadata for one knowledge item.", resource: "metadata", requiredPermission: "READ", inputSchema: itemIdSchema, outputSchema: z.record(z.string(), z.unknown()), rateLimit: { maxInvocations: 120, windowMs: 60_000 }, audited: true },
  { name: "find_similar", description: "Retrieve semantic candidates above a controlled similarity threshold.", resource: "embeddings", requiredPermission: "SEARCH", inputSchema: findSimilarInputSchema, outputSchema: z.array(z.unknown()), rateLimit: { maxInvocations: 30, windowMs: 60_000 }, audited: true },
  { name: "find_relationships", description: "Retrieve recorded relationship history for an item.", resource: "relationships", requiredPermission: "READ", inputSchema: itemIdSchema, outputSchema: z.array(z.unknown()), rateLimit: { maxInvocations: 60, windowMs: 60_000 }, audited: true },
  { name: "get_history", description: "Retrieve version and lineage history for an item.", resource: "archive", requiredPermission: "READ", inputSchema: itemIdSchema, outputSchema: z.array(z.unknown()), rateLimit: { maxInvocations: 60, windowMs: 60_000 }, audited: true },
  { name: "get_source", description: "Retrieve the declared source for an archived item.", resource: "knowledge", requiredPermission: "READ", inputSchema: itemIdSchema, outputSchema: sourceSchema.nullable(), rateLimit: { maxInvocations: 120, windowMs: 60_000 }, audited: true },
  { name: "submit_discovery", description: "Submit a discovery candidate for later curation.", resource: "knowledge", requiredPermission: "DISCOVER", inputSchema: discoverySubmissionSchema, outputSchema: z.unknown(), rateLimit: { maxInvocations: 30, windowMs: 60_000 }, audited: true },
  { name: "submit_context_assessment", description: "Submit a context assessment for later curator synthesis.", resource: "proposals", requiredPermission: "PROPOSE", inputSchema: contextSubmissionSchema, outputSchema: z.unknown(), rateLimit: { maxInvocations: 30, windowMs: 60_000 }, audited: true },
  { name: "submit_connection_proposal", description: "Submit a proposed relationship; it is not a canonical mutation.", resource: "relationships", requiredPermission: "CONNECT", inputSchema: connectionSubmissionSchema, outputSchema: z.unknown(), rateLimit: { maxInvocations: 60, windowMs: 60_000 }, audited: true },
  { name: "submit_quality_assessment", description: "Submit quality evidence for later curator synthesis.", resource: "proposals", requiredPermission: "PROPOSE", inputSchema: qualitySubmissionSchema, outputSchema: z.unknown(), rateLimit: { maxInvocations: 30, windowMs: 60_000 }, audited: true },
] as const satisfies readonly NuruToolDefinition[];

export const nuruToolDefinitions: readonly NuruToolDefinition[] = definitions;

type ToolDependencies = {
  search: Pick<typeof NuruSearchService, "search">;
  duplicates: Pick<NuruDuplicateService, "assess">;
  contradictions: Pick<typeof NuruContradictionService, "assess">;
  crossProject: Pick<NuruCrossProjectConnectionService, "find">;
  curatorMemory: Pick<typeof NuruCuratorMemoryService, "build">;
  archive: Pick<typeof NuruArchiveService, "retrieve" | "history">;
  metadata: typeof getMetadata;
  embeddings: Pick<NuruEmbeddingsService, "similar">;
  records: Pick<typeof NuruAgentRecordService, "submitDiscovery" | "submitContext" | "submitConnections" | "submitQuality" | "relationshipHistory">;
  audit: Pick<typeof NuruAuditService, "record">;
  authorize: typeof NuruPermissionsService.authorize;
  now: () => number;
};

const defaults: ToolDependencies = { search: NuruSearchService, duplicates: nuruDuplicateService, contradictions: NuruContradictionService, crossProject: nuruCrossProjectConnectionService, curatorMemory: NuruCuratorMemoryService, archive: NuruArchiveService, metadata: getMetadata, embeddings: nuruEmbeddingsService, records: NuruAgentRecordService, audit: NuruAuditService, authorize: NuruPermissionsService.authorize, now: () => Date.now() };

/** Controlled capability gateway. Agents receive this registry, never raw storage or service handles. */
export class NuruToolRegistry {
  private readonly invocations = new Map<string, number[]>();
  constructor(private readonly dependencies: ToolDependencies = defaults, private readonly registry = nuruToolDefinitions) {}

  list(agentId?: string) {
    return agentId ? this.registry.filter((tool) => NuruPermissionsService.authorize({ subject: agentId, resource: tool.resource, action: tool.requiredPermission, context: { correlationId: "tool-catalog", purpose: "List available Nuru tools." } }).allowed) : this.registry;
  }

  async invoke(name: string, rawInput: unknown, rawInvocation: ToolInvocation): Promise<unknown> {
    const invocation = toolInvocationSchema.parse(rawInvocation);
    const tool = this.registry.find((candidate) => candidate.name === name);
    if (!tool) throw new Error(`Unknown Nuru tool: ${name}`);
    const permission = this.dependencies.authorize({ subject: invocation.agentId, resource: tool.resource, action: tool.requiredPermission, context: { correlationId: invocation.correlationId, purpose: invocation.objective } });
    if (!permission.allowed) throw new Error(`Tool permission denied: ${permission.reason}`);
    this.enforceRateLimit(invocation.agentId, tool);
    const input = tool.inputSchema.parse(rawInput);
    const output = await this.execute(tool.name, input, invocation);
    const validatedOutput = tool.outputSchema.parse(output);
    if (tool.audited) await this.dependencies.audit.record({ operation: "TOOL_INVOKED", actor: invocation.agentId, agentRunId: invocation.runId, resourceId: name, inputReference: JSON.stringify(input).slice(0, 500), outputReference: "validated", decision: "ALLOWED", reason: `Invoked ${name} through the controlled tool registry.`, correlationId: invocation.correlationId });
    return validatedOutput;
  }

  private enforceRateLimit(agentId: string, tool: NuruToolDefinition) {
    const key = `${agentId}:${tool.name}`; const cutoff = this.dependencies.now() - tool.rateLimit.windowMs;
    const recent = (this.invocations.get(key) ?? []).filter((timestamp) => timestamp > cutoff);
    if (recent.length >= tool.rateLimit.maxInvocations) throw new Error(`Tool rate limit exceeded for ${tool.name}.`);
    recent.push(this.dependencies.now()); this.invocations.set(key, recent);
  }

  private async execute(name: string, input: unknown, invocation: ToolInvocation): Promise<unknown> {
    switch (name) {
      case "search_knowledge": return this.dependencies.search.search({ metadata: {}, ...(input as z.infer<typeof searchInputSchema>) });
      case "detect_duplicates": return this.dependencies.duplicates.assess(input as z.infer<typeof duplicateInputSchema>);
      case "detect_contradictions": return this.dependencies.contradictions.assess(input as z.infer<typeof contradictionInputSchema>);
      case "find_cross_project_connections": return this.dependencies.crossProject.find(input as z.infer<typeof crossProjectInputSchema>);
      case "get_item": return this.dependencies.archive.retrieve((input as z.infer<typeof itemIdSchema>).itemId);
      case "get_curator_memory": return this.dependencies.curatorMemory.build(input as z.infer<typeof curatorMemoryInputSchema>);
      case "get_metadata": return this.dependencies.metadata((input as z.infer<typeof itemIdSchema>).itemId);
      case "find_similar": { const value = input as z.infer<typeof findSimilarInputSchema>; return (await this.dependencies.embeddings.similar(value.content, value.limit, value.itemId)).filter((result) => result.score >= value.threshold); }
      case "find_relationships": return this.dependencies.records.relationshipHistory((input as z.infer<typeof itemIdSchema>).itemId);
      case "get_history": return this.dependencies.archive.history((input as z.infer<typeof itemIdSchema>).itemId);
      case "get_source": { const item = await this.dependencies.archive.retrieve((input as z.infer<typeof itemIdSchema>).itemId); return item?.source ?? null; }
      case "submit_discovery": return this.dependencies.records.submitDiscovery({ ...(input as object), createdBy: invocation.agentId, correlationId: invocation.correlationId });
      case "submit_context_assessment": return this.dependencies.records.submitContext({ ...(input as object), createdBy: invocation.agentId, correlationId: invocation.correlationId });
      case "submit_connection_proposal": return this.dependencies.records.submitConnections({ ...(input as object), proposedBy: invocation.agentId });
      case "submit_quality_assessment": return this.dependencies.records.submitQuality({ ...(input as object), createdBy: invocation.agentId, correlationId: invocation.correlationId });
      default: throw new Error(`No registered executor for ${name}.`);
    }
  }
}

export const nuruToolRegistry = new NuruToolRegistry();
