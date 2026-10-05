import { z } from "zod";
import { sourceSchema } from "@/src/nuru/domain";

export const tandemParticipantTypeSchema = z.enum(["HUMAN", "AGENT", "KNOWLEDGE_AUTHORITY"]);
export const tandemKnowledgeContextSchema = z.enum(["MISSION", "DECISION", "BRIEFING", "RESEARCH", "TIMELINE"]);

/** The request boundary for Tandem. It is deliberately retrieval-only. */
export const tandemKnowledgeRequestSchema = z.object({
  requestId: z.string().trim().min(1).max(120),
  missionId: z.string().trim().min(1).max(120),
  participantId: z.string().trim().min(1).max(120),
  participantType: tandemParticipantTypeSchema,
  subject: z.string().trim().min(2).max(500),
  requestedContext: z.array(tandemKnowledgeContextSchema).min(1).max(5),
  asOf: z.coerce.date().optional(),
  freshnessRequirement: z.enum(["CURRENT", "HISTORICAL", "ANY"]).default("CURRENT"),
  provenanceRequired: z.literal(true),
  maxResults: z.coerce.number().int().min(1).max(20).default(10),
});

export const tandemKnowledgeSourceSchema = z.object({
  sourceType: z.string().min(1),
  origin: z.string().min(1),
  uri: z.string().url().optional(),
  authority: z.string().min(1),
});

export const tandemEntityResolutionSchema = z.object({
  query: z.string().min(1),
  status: z.enum(["RESOLVED", "UNRESOLVED", "AMBIGUOUS"]),
  canonicalId: z.string().min(1).nullable(),
  canonicalName: z.string().min(1).nullable(),
  entityType: z.string().min(1).nullable(),
  confidence: z.number().min(0).max(1),
  candidates: z.array(z.object({ id: z.string().min(1), name: z.string().min(1), entityType: z.string().min(1) })).max(10),
});

export const tandemProvenanceStepSchema = z.object({
  stage: z.string().min(1),
  referenceId: z.string().min(1),
  actor: z.string().min(1),
  recordedAt: z.string().datetime().optional(),
});

export const tandemKnowledgeClaimSchema = z.object({
  id: z.string().min(1),
  subjectId: z.string().min(1),
  predicate: z.string().min(1),
  value: z.unknown(),
  normalizedValue: z.string().min(1),
  state: z.enum(["VERIFIED", "DISPUTED"]),
  effectiveFrom: z.string().datetime(),
  effectiveTo: z.string().datetime().nullable(),
  assertedAt: z.string().datetime(),
  observedAt: z.string().datetime(),
  evidence: z.array(z.object({ referenceId: z.string().min(1), detail: z.string().min(1) })).min(1),
});

export const tandemKnowledgePackageSchema = z.object({
  packageId: z.string().min(1),
  authority: z.literal("NURU"),
  authorityVersion: z.literal("NURU_TANDEM_V1"),
  requestId: z.string().min(1),
  missionId: z.string().min(1),
  subject: z.string().min(1),
  resolvedEntity: tandemEntityResolutionSchema,
  retrievedAt: z.string().datetime(),
  freshnessRequirement: z.enum(["CURRENT", "HISTORICAL", "ANY"]),
  knowledge: z.array(z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    content: z.string().min(1),
    contentType: z.string().min(1),
    confidence: z.number().min(0).max(1),
    createdAt: z.string().datetime(),
    source: tandemKnowledgeSourceSchema,
    provenance: z.array(tandemProvenanceStepSchema).min(1),
  })),
  temporalClaims: z.array(tandemKnowledgeClaimSchema),
  relationships: z.array(z.object({ sourceItemId: z.string(), targetItemId: z.string(), relationshipType: z.string(), confidence: z.number().min(0).max(1), evidence: z.string() })).default([]),
  uncertainties: z.array(z.string().min(1)),
  openQuestions: z.array(z.string().min(1)),
  writePolicy: z.literal("READ_ONLY_NO_CANONICAL_WRITE"),
});

export const tandemMissionKnowledgeAttachmentSchema = z.object({
  attachmentId: z.string().min(1),
  workspaceId: z.string().min(1),
  missionId: z.string().min(1),
  attachedBy: z.string().min(1),
  attachedAt: z.string().datetime(),
  package: tandemKnowledgePackageSchema,
  immutable: z.literal(true),
  canonicalKnowledgeEffect: z.literal("NONE"),
});

/** Tandem may propose evidence to Nuru; this object has no canonical authority. */
export const tandemKnowledgeCandidateSchema = z.object({
  candidateId: z.string().trim().min(1).max(120),
  revisionOfCandidateId: z.string().trim().min(1).max(120).optional(),
  missionId: z.string().trim().min(1).max(120),
  originatingSystem: z.string().trim().min(1).max(120),
  originatingAgent: z.string().trim().min(1).max(120).optional(),
  subject: z.string().trim().min(1).max(500),
  proposedClaims: z.array(z.object({ text: z.string().trim().min(10).max(4_000), confidence: z.number().min(0).max(1) })).min(1).max(25),
  entities: z.array(z.string().trim().min(1).max(200)).max(50).default([]),
  evidence: z.array(z.object({ referenceId: z.string().trim().min(1).max(300), detail: z.string().trim().min(3).max(2_000) })).min(1).max(100),
  sources: z.array(sourceSchema).min(1).max(25),
  eventTime: z.coerce.date(),
  observedAt: z.coerce.date(),
  significance: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  reasonForPreservation: z.string().trim().min(10).max(2_000),
  provenance: z.object({ missionContextPackageIds: z.array(z.string().min(1)).max(20).default([]), correlationId: z.string().min(1).max(120) }),
}).superRefine((candidate, context) => {
  if (candidate.observedAt < candidate.eventTime) context.addIssue({ code: z.ZodIssueCode.custom, path: ["observedAt"], message: "observedAt must be on or after eventTime." });
});

export const tandemKnowledgeCandidateReceiptSchema = z.object({
  receiptId: z.string().min(1),
  workspaceId: z.string().min(1),
  candidateId: z.string().min(1),
  revisionOfCandidateId: z.string().min(1).optional(),
  missionId: z.string().min(1),
  curationProposalId: z.string().min(1),
  receivedAt: z.string().datetime(),
  status: z.literal("QUEUED_FOR_HUMAN_REVIEW"),
  canonicalKnowledgeEffect: z.literal("NONE"),
});

/** Tandem polls this read-only acknowledgement before deciding whether to submit a revision. */
export const tandemKnowledgeCandidateFeedbackSchema = z.object({
  candidateId: z.string().min(1),
  missionId: z.string().min(1),
  curationProposalId: z.string().min(1),
  status: z.string().min(1),
  decisionReason: z.string().nullable(),
  revisionRequested: z.boolean(),
  canonicalKnowledgeEffect: z.literal("NONE"),
});

export const tandemKnowledgeSubscriptionSchema = z.object({
  subscriptionId: z.string().trim().min(1).max(120), missionId: z.string().trim().min(1).max(120),
  entityIds: z.array(z.string().trim().min(1)).max(50).default([]), topics: z.array(z.string().trim().min(1)).max(50).default([]),
  eventTypes: z.array(z.enum(["KNOWLEDGE_APPROVED", "KNOWLEDGE_CORRECTED", "CONTRADICTION_RESOLVED", "KNOWLEDGE_SUPERSEDED"])).min(1).max(10),
  significanceThreshold: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
}).refine((value) => value.entityIds.length > 0 || value.topics.length > 0, "A subscription requires an entity or topic.");

export const tandemKnowledgeUpdateSchema = z.object({
  updateId: z.string().min(1), eventType: z.enum(["KNOWLEDGE_APPROVED", "KNOWLEDGE_CORRECTED", "CONTRADICTION_RESOLVED", "KNOWLEDGE_SUPERSEDED"]),
  entityIds: z.array(z.string().min(1)).max(50), topics: z.array(z.string().min(1)).max(50), significance: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  knowledgeItemId: z.string().min(1), occurredAt: z.coerce.date(), provenanceReference: z.string().min(1),
});

export const tandemKnowledgeSubscriptionDeliverySchema = z.object({ deliveryId: z.string().min(1), subscriptionId: z.string().min(1), missionId: z.string().min(1), updateId: z.string().min(1), deliveredAt: z.string().datetime(), contextMutation: z.literal("NONE") });

export type TandemKnowledgeRequest = z.infer<typeof tandemKnowledgeRequestSchema>;
export type TandemKnowledgePackage = z.infer<typeof tandemKnowledgePackageSchema>;
export type TandemMissionKnowledgeAttachment = z.infer<typeof tandemMissionKnowledgeAttachmentSchema>;
export type TandemKnowledgeCandidate = z.infer<typeof tandemKnowledgeCandidateSchema>;
export type TandemKnowledgeCandidateReceipt = z.infer<typeof tandemKnowledgeCandidateReceiptSchema>;
export type TandemKnowledgeCandidateFeedback = z.infer<typeof tandemKnowledgeCandidateFeedbackSchema>;
export type TandemKnowledgeSubscription = z.infer<typeof tandemKnowledgeSubscriptionSchema>;
export type TandemKnowledgeUpdate = z.infer<typeof tandemKnowledgeUpdateSchema>;
