import type { KnowledgeScopeReference } from "./knowledgeScope";
import type { ProvenanceActor } from "./provenance";

export const EXAMPLE_TYPES = ["POSITIVE", "NEGATIVE", "EDGE_CASE", "COUNTEREXAMPLE"] as const;
export type ExampleType = (typeof EXAMPLE_TYPES)[number];
export const EXAMPLE_PARENT_TYPES = ["PRINCIPLE", "PROCEDURE", "SKILL"] as const;
export type ExampleParentType = (typeof EXAMPLE_PARENT_TYPES)[number];
export type ExampleContentRole = "ILLUSTRATIVE" | "QUOTED";
export type ExampleAuthority = "HUMAN_CREATED" | "AGENT_DERIVED" | "APPROVED_EXAMPLE";
export type ExampleStatus = "CANDIDATE" | "APPROVED" | "REJECTED" | "RETIRED" | "INVALIDATED" | "SUPERSEDED";
export type ExampleParent = Readonly<{ parentType: ExampleParentType; parentId: string; scope: KnowledgeScopeReference; authority: string; version: string; exists: boolean }>;
/** Example content is illustrative evidence. Its wording never becomes a directive or authority input. */
export type LearningExample = Readonly<{ exampleId: string; exampleType: ExampleType; parent: ExampleParent; scenario: string; inputs: Readonly<Record<string, unknown>>; context: string; expectedReasoning: string; expectedBehavior: string; expectedOutput: string; explanation: string; boundaryIllustrated?: string; failureIllustrated?: string; contentRole: ExampleContentRole; source: "HUMAN_TEACHING" | "HUMAN_CORRECTION" | "TEACH_BACK" | "PROCEDURE_TEST" | "AGENT_GENERATED" | "OBSERVED_FAILURE" | "REGRESSION_TEST" | "SIMULATION"; authority: ExampleAuthority; scope: KnowledgeScopeReference; provenanceIds: readonly string[]; diversityKey: string; introducesNewRule: boolean; introducesException: boolean; status: "CANDIDATE"; createdBy: ProvenanceActor; createdAt: string; immutable: true; executionPermissionGranted: false }>;
export type ExampleValidationReason = "PARENT_MISSING" | "PARENT_SCOPE_EXPANSION" | "EXAMPLE_INTRODUCES_NEW_RULE" | "EXAMPLE_INTRODUCES_EXCEPTION" | "ILLUSTRATIVE_CONTENT_REQUIRED" | "PROVENANCE_MISSING" | "EXAMPLE_VALID";
export type ExampleValidation = Readonly<{ exampleId: string; status: "VALID" | "DEFER" | "REJECT"; reasonCodes: readonly ExampleValidationReason[]; persistenceEffect: "NONE"; authorityEffect: "UNCHANGED"; executionPermissionGranted: false }>;
export type ExampleCoverage = Readonly<{ parentId: string; counts: Readonly<Record<ExampleType, number>>; coverage: "NONE" | "MINIMAL" | "PARTIAL" | "STRONG" | "COMPLETE"; independenceCount: number }>;
export interface ExampleValidator { validate(example: LearningExample): ExampleValidation; }
export type ExampleReviewAction = "APPROVE" | "REJECT";
/** A review is a separate immutable decision record; it never changes the candidate example. */
export type ExampleHumanReview = Readonly<{ reviewId: string; exampleId: string; action: ExampleReviewAction; actor: ProvenanceActor; note: string; reviewedAt: string; immutable: true }>;
/** Approval allows pedagogical use only. It creates no parent rule, exception, authority, or execution capability. */
export type ApprovedLearningExample = Readonly<{ approvedExampleId: string; reviewId: string; example: LearningExample; authority: "APPROVED_EXAMPLE"; status: "APPROVED"; approvedBy: ProvenanceActor; approvedAt: string; immutable: true; parentMutationAuthorized: false; executionPermissionGranted: false }>;
export type ExampleUsePurpose = "TEACHING" | "EVALUATION";
export type ExampleLifecycleAction = "INVALIDATE" | "SUPERSEDE";
export type ExampleLifecycleDecision = Readonly<{ decisionId: string; action: ExampleLifecycleAction; exampleId: string; replacementExampleId?: string; actor: ProvenanceActor; reason: string; decidedAt: string; immutable: true; parentMutationAuthorized: false; executionPermissionGranted: false }>;
/** Selection is read-only: it returns pedagogical evidence, never executable instructions. */
export type ExampleSelection = Readonly<{ parentId: string; purpose: ExampleUsePurpose; examples: readonly ApprovedLearningExample[]; excludedCount: number; diversityCount: number; persistenceEffect: "NONE"; authorityEffect: "UNCHANGED"; executionPermissionGranted: false }>;
/** Immutable storage envelope. A lifecycle artifact records evidence but cannot mutate its example or parent. */
export type ExampleArtifactRecord = Readonly<{ artifactId: string; artifactType: "CANDIDATE" | "VALIDATION" | "REVIEW" | "APPROVAL" | "REJECTION" | "INVALIDATION" | "SUPERSESSION"; subjectId: string; payload: unknown; createdAt: string }>;
export interface ExampleArtifactStore { append(artifact: ExampleArtifactRecord): Promise<ExampleArtifactRecord>; listArtifacts(subjectId: string): Promise<readonly ExampleArtifactRecord[]>; }
