import { z } from "zod";
import { confidenceBandSchema } from "@/src/nuru/confidence";

export const knowledgeStatuses = ["DISCOVERED", "ANALYZING", "READY_FOR_REVIEW", "APPROVED", "REJECTED", "ARCHIVED", "SUPERSEDED"] as const;
export const sourceTypes = ["HUMAN_INPUT", "PROJECT_DOCUMENT", "CODE", "DATABASE_RECORD", "EMAIL", "WEB_SOURCE", "API", "AGENT_OUTPUT", "GENERATED_ARTIFACT"] as const;
export const relationshipTypes = ["RELATED_TO", "DEPENDS_ON", "IMPLEMENTS", "DERIVED_FROM", "SUPERSEDES", "SUPERSEDED_BY", "CONTRADICTS", "SUPPORTS", "REFINES", "EXTENDS", "EXPANDS", "EXAMPLE_OF", "PART_OF", "REFERENCES", "DEFINES_BOUNDARY"] as const;
export const qualityStatuses = ["PASS", "PASS_WITH_WARNINGS", "NEEDS_REVIEW", "INSUFFICIENT_EVIDENCE", "CONFLICT", "REJECT_RECOMMENDED"] as const;
export const recommendations = ["ACCEPT", "REJECT", "HOLD", "MERGE", "UPDATE", "SUPERSEDE", "REQUEST_REVIEW", "REQUEST_MORE_EVIDENCE"] as const;
export const decisionOutcomes = ["APPROVED", "REJECTED", "HOLD", "REQUEST_CHANGES", "MORE_EVIDENCE_REQUIRED"] as const;

export const sourceSchema = z.object({
  id: z.string().min(1).optional(),
  sourceId: z.string().min(1).optional(),
  claimCandidateId: z.string().min(1).optional(),
  sourceType: z.enum(sourceTypes),
  origin: z.string().trim().min(1).max(500),
  uri: z.string().url().optional(),
  location: z.string().trim().min(1).max(2_000).optional(),
  author: z.string().trim().max(160).optional(),
  createdAt: z.string().datetime().optional(),
  retrievedAt: z.string().datetime().optional(),
  authority: z.enum(["LOW", "MODERATE", "HIGH", "OWNER"]),
  checksum: z.string().max(256).optional(),
  version: z.string().max(80).optional(),
  derivedFromSourceId: z.string().min(1).optional(),
}).superRefine((source, context) => {
  if (source.sourceType === "AGENT_OUTPUT" && source.authority !== "LOW") context.addIssue({ code: z.ZodIssueCode.custom, path: ["authority"], message: "Agent output is derived evidence and must use LOW authority." });
  if (source.sourceType === "AGENT_OUTPUT" && !source.derivedFromSourceId) context.addIssue({ code: z.ZodIssueCode.custom, path: ["derivedFromSourceId"], message: "Agent output must identify its source lineage." });
});

export const provenanceSchema = z.object({
  source: sourceSchema,
  submittedBy: z.string().min(1),
  transformations: z.array(z.object({ actor: z.string(), action: z.string(), at: z.string().datetime() })).default([]),
});

export const relationshipSchema = z.object({
  sourceItemId: z.string().min(1).optional(),
  targetItemId: z.string().min(1),
  relationshipType: z.enum(relationshipTypes),
  confidence: z.number().min(0).max(1),
  evidence: z.string().min(1),
  proposedBy: z.string().min(1),
  status: z.enum(["PROPOSED", "APPROVED", "REJECTED"]),
});

export const knowledgeItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(180),
  content: z.string().trim().min(1),
  contentType: z.string().trim().min(1),
  source: sourceSchema,
  sourceUri: z.string().url().optional(),
  project: z.string().trim().max(120).optional(),
  createdAt: z.string().datetime(),
  discoveredAt: z.string().datetime().optional(),
  author: z.string().trim().max(160).optional(),
  tags: z.array(z.string().trim().min(1)).default([]),
  status: z.enum(knowledgeStatuses),
  confidence: z.number().min(0).max(1),
  provenance: provenanceSchema,
  relationships: z.array(relationshipSchema).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const discoverySchema = z.object({ itemId: z.string(), source: sourceSchema, reasonDiscovered: z.string(), initialType: z.string(), relevanceScore: z.number().min(0).max(100), confidence: z.number().min(0).max(1) });
export const discoveryCandidateSchema = z.object({ id: z.string(), item: z.object({ title: z.string(), content: z.string() }), source: sourceSchema, reasonDiscovered: z.string(), initialType: z.string(), relevanceScore: z.number().min(0).max(100), confidence: z.number().min(0).max(1), status: z.literal("CANDIDATE") });
export const contextAssessmentSchema = z.object({ itemId: z.string(), project: z.string().optional(), artifactType: z.string(), scope: z.string(), topic: z.string().optional(), confidence: z.number().min(0).max(1), evidence: z.array(z.string()).default([]) });
export const connectionSchema = relationshipSchema.extend({ itemId: z.string() });
export const qualityAssessmentSchema = z.object({ itemId: z.string(), status: z.enum(qualityStatuses), confidence: z.number().min(0).max(1), warnings: z.array(z.string()).default([]), evidence: z.array(z.string()).default([]) });
export const curatorMemorySummarySchema = z.object({ project: z.string(), canonicalPrinciples: z.number().int().nonnegative(), projectRules: z.number().int().nonnegative(), openConflicts: z.number().int().nonnegative(), pendingReviews: z.number().int().nonnegative(), recentDecisions: z.number().int().nonnegative(), relevantRelationships: z.number().int().nonnegative(), policyCount: z.number().int().nonnegative(), unavailable: z.boolean().default(false) });
export const discoveryAgentOutputSchema = discoveryCandidateSchema.extend({ confidenceBand: confidenceBandSchema });
export const contextAgentOutputSchema = z.object({ candidateId: z.string().min(1), itemId: z.string().min(1), project: z.string().min(1), primaryProject: z.string().min(1), relatedProjects: z.array(z.string()), topic: z.string().min(1), artifactType: z.string().min(1), scope: z.string().min(1), topics: z.array(z.string().min(1)).min(1), sourceContext: z.string().min(1), likelyPurpose: z.string().min(1), dependencies: z.array(z.string()), applicableSystem: z.string().optional(), historicalContext: z.string().optional(), relatedComponents: z.array(z.string()), confidence: z.number().min(0).max(1), confidenceBand: confidenceBandSchema, reasoningSummary: z.string().min(1) });
export const connectionAgentOutputSchema = z.object({ proposals: z.array(connectionSchema), crossProjectConnections: z.array(z.object({ targetItemId: z.string(), targetProject: z.string(), confidence: z.number(), status: z.literal("PROPOSED") })).default([]), duplicateAssessment: z.object({ result: z.enum(["NOT_DUPLICATE", "EXACT_DUPLICATE", "POSSIBLE_DUPLICATE", "SEMANTIC_DUPLICATE", "UPDATED_VERSION"]), matchedItemId: z.string().optional(), confidence: z.number().min(0).max(1) }).optional(), candidatesConsidered: z.number().int().min(0), historicalRelationships: z.number().int().min(0), highImpactRequiresValidation: z.boolean(), confidence: z.number().min(0).max(1), confidenceBand: confidenceBandSchema, reasoningSummary: z.string().min(1) });
export const qualityIssueSchema = z.object({ type: z.enum(["POSSIBLE_DUPLICATE", "UNKNOWN_SOURCE", "MISSING_PROVENANCE", "CONTEXT_REVIEW", "INSUFFICIENT_RELATIONSHIP_EVIDENCE", "CONFLICT"]), relatedItem: z.string().optional(), severity: z.enum(["LOW", "MEDIUM", "HIGH"]) });
export const qualityAgentOutputSchema = z.object({ itemId: z.string().min(1), status: z.enum(qualityStatuses), result: z.enum(qualityStatuses), issues: z.array(qualityIssueSchema), sourceKnown: z.boolean(), provenanceAvailable: z.boolean(), duplicateState: z.string().min(1), conflictDetected: z.boolean(), contextAccurate: z.boolean(), relationshipsJustified: z.boolean(), evidenceSufficient: z.boolean(), confidence: z.number().min(0).max(1), confidenceBand: confidenceBandSchema, warnings: z.array(z.string()), reasoningSummary: z.string().min(1) });
export const curationStateSchema = z.object({ status: z.enum(["CURATION_COMPLETE", "CURATION_INCOMPLETE"]), degraded: z.boolean(), completedSpecialists: z.array(z.string()), unavailable: z.array(z.object({ specialist: z.string(), reason: z.string() })), message: z.string().min(1) });
export const curationTraceSchema = z.object({ discoveryRunId: z.string().min(1), contextRunId: z.string().min(1), connectionRunId: z.string().min(1).optional(), qualityRunId: z.string().min(1).optional(), proposalId: z.string().min(1) });
export const curationProposalSchema = z.object({ id: z.string(), itemId: z.string(), recommendation: z.enum(recommendations), classification: z.string(), project: z.string().optional(), relationships: z.array(relationshipSchema), qualityStatus: z.enum(qualityStatuses), confidence: z.number().min(0).max(1), evidence: z.array(z.string()), reasoningSummary: z.string(), warnings: z.array(z.string()), requiredReview: z.boolean(), createdBy: z.string(), createdAt: z.string().datetime() });
export const curatorAgentOutputSchema = z.object({ workflow: z.enum(["FAST", "STANDARD"]), workflowTemplate: z.enum(["FAST_PATH", "STANDARD_PATH", "CONFLICT_PATH", "HIGH_AUTHORITY_PATH"]).optional(), specialists: z.array(z.string()).optional(), candidate: discoveryAgentOutputSchema.optional(), context: contextAssessmentSchema.optional(), curatorMemory: curatorMemorySummarySchema.optional(), connections: z.array(connectionSchema).optional(), quality: qualityAgentOutputSchema.optional(), curation: curationStateSchema, provenance: curationTraceSchema.optional(), proposal: curationProposalSchema.nullable() });
export const curationDecisionSchema = z.object({ proposalId: z.string(), outcome: z.enum(decisionOutcomes), decidedBy: z.string(), reason: z.string(), decidedAt: z.string().datetime() });
export const auditEventSchema = z.object({ id: z.string(), timestamp: z.string().datetime(), actor: z.string(), agentRunId: z.string().optional(), operation: z.string(), resourceId: z.string(), inputReference: z.string().optional(), outputReference: z.string().optional(), decision: z.string().optional(), reason: z.string().optional(), correlationId: z.string() });

export type KnowledgeItem = z.infer<typeof knowledgeItemSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type Discovery = z.infer<typeof discoverySchema>;
export type DiscoveryCandidate = z.infer<typeof discoveryCandidateSchema>;
export type ContextAssessment = z.infer<typeof contextAssessmentSchema>;
export type Connection = z.infer<typeof connectionSchema>;
export type QualityAssessment = z.infer<typeof qualityAssessmentSchema>;
export type ContextAgentOutput = z.infer<typeof contextAgentOutputSchema>;
export type ConnectionAgentOutput = z.infer<typeof connectionAgentOutputSchema>;
export type QualityAgentOutput = z.infer<typeof qualityAgentOutputSchema>;
export type QualityIssue = z.infer<typeof qualityIssueSchema>;
export type CuratorAgentOutput = z.infer<typeof curatorAgentOutputSchema>;
export type CurationProposal = z.infer<typeof curationProposalSchema>;
export type CurationDecision = z.infer<typeof curationDecisionSchema>;
export type AuditEvent = z.infer<typeof auditEventSchema>;
