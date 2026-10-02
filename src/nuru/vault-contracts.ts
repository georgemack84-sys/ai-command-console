import { z } from "zod";

/** The compatibility boundary for persisted Nuru Vault records. */
export const vaultSchemaVersion = "nuru.vault/v1" as const;

const vaultIdSchema = z.string().trim().min(1).max(160);
const timestampSchema = z.string().datetime({ offset: true });
const correlationIdSchema = z.string().uuid();

export const dataClassifications = ["PUBLIC", "PERSONAL", "PRIVATE", "CONFIDENTIAL", "RESTRICTED", "SYSTEM"] as const;
export const candidateStatuses = ["PROPOSED", "HELD", "REJECTED", "APPROVED"] as const;
export const canonicalRecordStatuses = ["CURRENT", "SUPERSEDED", "RETIRED"] as const;
export const governanceOutcomes = ["APPROVED", "REJECTED", "HOLD", "MORE_EVIDENCE_REQUIRED", "REQUEST_CHANGES"] as const;

const recordEnvelopeSchema = z.object({
  schemaVersion: z.literal(vaultSchemaVersion),
  id: vaultIdSchema,
  classification: z.enum(dataClassifications),
  createdAt: timestampSchema,
  correlationId: correlationIdSchema,
});

export const vaultSourceSchema = recordEnvelopeSchema.extend({
  kind: z.literal("SOURCE"),
  origin: z.string().trim().min(1).max(2_000),
  authority: z.enum(["LOW", "MODERATE", "HIGH", "OWNER"]),
  policyVersion: z.string().trim().min(1).max(80),
  retrievedAt: timestampSchema,
  contentHash: z.string().trim().regex(/^sha256:[a-f0-9]{64}$/),
});

export const vaultEvidenceSchema = recordEnvelopeSchema.extend({
  kind: z.literal("EVIDENCE"),
  sourceId: vaultIdSchema,
  locator: z.string().trim().min(1).max(2_000),
  capturedAt: timestampSchema,
  contentHash: z.string().trim().regex(/^sha256:[a-f0-9]{64}$/),
});

export const vaultCandidateSchema = recordEnvelopeSchema.extend({
  kind: z.literal("CANDIDATE"),
  evidenceIds: z.array(vaultIdSchema).min(1),
  interpretation: z.string().trim().min(1).max(10_000),
  confidence: z.number().min(0).max(1),
  producedBy: z.string().trim().min(1).max(160),
  status: z.enum(candidateStatuses),
});

export const governanceDecisionSchema = recordEnvelopeSchema.extend({
  kind: z.literal("GOVERNANCE_DECISION"),
  candidateId: vaultIdSchema,
  outcome: z.enum(governanceOutcomes),
  decidedBy: z.string().trim().min(1).max(160),
  decidedAt: timestampSchema,
  rationale: z.string().trim().min(1).max(10_000),
  requiredHumanReview: z.boolean(),
  humanApprovalId: vaultIdSchema.optional(),
}).superRefine((decision, context) => {
  if (decision.requiredHumanReview && !decision.humanApprovalId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["humanApprovalId"], message: "A required human review must retain its approval reference." });
  }
  if (decision.outcome === "APPROVED" && !decision.humanApprovalId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["humanApprovalId"], message: "Canonical approval requires a human approval reference in Vault v1." });
  }
});

export const canonicalRecordSchema = recordEnvelopeSchema.extend({
  kind: z.literal("CANONICAL_RECORD"),
  candidateId: vaultIdSchema,
  governanceDecisionId: vaultIdSchema,
  version: z.number().int().positive(),
  status: z.enum(canonicalRecordStatuses),
  supersededById: vaultIdSchema.optional(),
}).superRefine((record, context) => {
  if (record.status === "SUPERSEDED" && !record.supersededById) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["supersededById"], message: "A superseded record must identify its successor." });
  }
  if (record.status !== "SUPERSEDED" && record.supersededById) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["supersededById"], message: "Only superseded records may identify a successor." });
  }
});

/** A governed, append-only architecture decision for a named project. */
export const projectDecisionSchema = recordEnvelopeSchema.extend({
  kind: z.literal("PROJECT_DECISION"),
  project: z.string().trim().min(1).max(160),
  question: z.string().trim().min(1).max(2_000),
  decision: z.string().trim().min(1).max(10_000),
  rationale: z.string().trim().min(1).max(10_000),
  alternatives: z.array(z.string().trim().min(1).max(2_000)).max(50),
  candidateId: vaultIdSchema,
  governanceDecisionId: vaultIdSchema,
  decidedAt: timestampSchema,
  version: z.number().int().positive(),
  status: z.enum(["CURRENT", "SUPERSEDED"]),
  supersededById: vaultIdSchema.optional(),
}).superRefine((record, context) => {
  if (record.status === "SUPERSEDED" && !record.supersededById) context.addIssue({ code: z.ZodIssueCode.custom, path: ["supersededById"], message: "A superseded project decision must identify its successor." });
  if (record.status === "CURRENT" && record.supersededById) context.addIssue({ code: z.ZodIssueCode.custom, path: ["supersededById"], message: "Only superseded project decisions may identify a successor." });
});

/** A governed requirement with explicit decision, implementation, and test traceability. */
export const projectRequirementSchema = recordEnvelopeSchema.extend({
  kind: z.literal("PROJECT_REQUIREMENT"),
  project: z.string().trim().min(1).max(160),
  title: z.string().trim().min(1).max(500),
  description: z.string().trim().min(1).max(10_000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  acceptanceCriteria: z.array(z.string().trim().min(1).max(2_000)).min(1).max(100),
  projectDecisionId: vaultIdSchema,
  implementationRefs: z.array(z.string().trim().min(1).max(2_000)).max(100),
  testRefs: z.array(z.string().trim().min(1).max(2_000)).max(100),
  implementationStatus: z.enum(["PLANNED", "IN_PROGRESS", "IMPLEMENTED", "QUALIFIED", "DEPRECATED"]),
  candidateId: vaultIdSchema,
  governanceDecisionId: vaultIdSchema,
  version: z.number().int().positive(),
  status: z.enum(["CURRENT", "SUPERSEDED"]),
  supersededById: vaultIdSchema.optional(),
}).superRefine((record, context) => {
  if (record.status === "SUPERSEDED" && !record.supersededById) context.addIssue({ code: z.ZodIssueCode.custom, path: ["supersededById"], message: "A superseded requirement must identify its successor." });
  if (record.status === "CURRENT" && record.supersededById) context.addIssue({ code: z.ZodIssueCode.custom, path: ["supersededById"], message: "Only superseded requirements may identify a successor." });
});

/** An implementation-ready, governed package derived from current project requirements. */
export const codexBuildPackageSchema = recordEnvelopeSchema.extend({
  kind: z.literal("CODEX_BUILD_PACKAGE"),
  project: z.string().trim().min(1).max(160),
  objective: z.string().trim().min(1).max(10_000),
  requirementIds: z.array(vaultIdSchema).min(1).max(100),
  architectureDecisionIds: z.array(vaultIdSchema).min(1).max(100),
  expectedFiles: z.array(z.string().trim().min(1).max(2_000)).max(200),
  interfaces: z.array(z.string().trim().min(1).max(2_000)).max(100),
  testRefs: z.array(z.string().trim().min(1).max(2_000)).min(1).max(100),
  migrationNotes: z.array(z.string().trim().min(1).max(2_000)).max(50),
  dependencies: z.array(z.string().trim().min(1).max(2_000)).max(100),
  exitCriteria: z.array(z.string().trim().min(1).max(2_000)).min(1).max(100),
  verificationCommands: z.array(z.string().trim().min(1).max(500)).min(1).max(50),
  status: z.enum(["PLANNED", "IN_PROGRESS", "QUALIFIED", "BLOCKED", "RETIRED"]),
  candidateId: vaultIdSchema,
  governanceDecisionId: vaultIdSchema,
  version: z.number().int().positive(),
  supersedesPackageId: vaultIdSchema.optional(),
});

/** Evidence of a concrete implementation run against a governed build package. */
export const codexImplementationLedgerSchema = recordEnvelopeSchema.extend({
  kind: z.literal("CODEX_IMPLEMENTATION_LEDGER"),
  buildPackageId: vaultIdSchema,
  branch: z.string().trim().min(1).max(500),
  commit: z.string().trim().min(1).max(160).optional(),
  filesChanged: z.array(z.string().trim().min(1).max(2_000)).max(1_000),
  commandsExecuted: z.array(z.string().trim().min(1).max(2_000)).min(1).max(500),
  testsExecuted: z.array(z.string().trim().min(1).max(2_000)).max(500),
  migrationStatus: z.enum(["NOT_REQUIRED", "APPLIED", "PENDING", "FAILED"]),
  qualificationStatus: z.enum(["QUALIFIED", "PARTIAL", "BLOCKED", "FAILED"]),
  knownLimitations: z.array(z.string().trim().min(1).max(2_000)).max(100),
  recordedBy: z.string().trim().min(1).max(160),
});
export const codexExecutionEventSchema = recordEnvelopeSchema.extend({ kind: z.literal("CODEX_EXECUTION_EVENT"), buildPackageId: vaultIdSchema, event: z.literal("STARTED"), branch: z.string().trim().min(1).max(500), startedBy: z.string().trim().min(1).max(160), startedAt: timestampSchema });

export const vaultAuditEventSchema = recordEnvelopeSchema.extend({
  kind: z.literal("AUDIT_EVENT"),
  eventType: z.enum(["SOURCE_CAPTURED", "EVIDENCE_CAPTURED", "CANDIDATE_PROPOSED", "DECISION_RECORDED", "CANONICAL_PROMOTED", "RECORD_SUPERSEDED", "VALIDATION_REJECTED"]),
  actor: z.string().trim().min(1).max(160),
  resourceId: vaultIdSchema,
  occurredAt: timestampSchema,
  reason: z.string().trim().min(1).max(2_000),
});

export const vaultRecordSchema = z.discriminatedUnion("kind", [
  vaultSourceSchema,
  vaultEvidenceSchema,
  vaultCandidateSchema,
  governanceDecisionSchema,
  canonicalRecordSchema,
  projectDecisionSchema,
  projectRequirementSchema,
  codexBuildPackageSchema,
  codexImplementationLedgerSchema,
  codexExecutionEventSchema,
  vaultAuditEventSchema,
]);

export type VaultSource = z.infer<typeof vaultSourceSchema>;
export type VaultEvidence = z.infer<typeof vaultEvidenceSchema>;
export type VaultCandidate = z.infer<typeof vaultCandidateSchema>;
export type GovernanceDecision = z.infer<typeof governanceDecisionSchema>;
export type CanonicalRecord = z.infer<typeof canonicalRecordSchema>;
export type ProjectDecision = z.infer<typeof projectDecisionSchema>;
export type ProjectRequirement = z.infer<typeof projectRequirementSchema>;
export type CodexBuildPackage = z.infer<typeof codexBuildPackageSchema>;
export type CodexImplementationLedger = z.infer<typeof codexImplementationLedgerSchema>;
export type CodexExecutionEvent = z.infer<typeof codexExecutionEventSchema>;
export type VaultAuditEvent = z.infer<typeof vaultAuditEventSchema>;
export type VaultRecord = z.infer<typeof vaultRecordSchema>;
