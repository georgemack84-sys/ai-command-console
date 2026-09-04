import type { KnowledgeScopeReference } from "./knowledgeScope";
import type { ProvenanceActor } from "./provenance";

export const PROCEDURE_STATUSES = ["DRAFT", "INCOMPLETE", "CANDIDATE", "APPROVED", "ACTIVE", "DEPRECATED", "SUPERSEDED", "SUSPENDED"] as const;
export type ProcedureStatus = (typeof PROCEDURE_STATUSES)[number];
export const PROCEDURE_INPUT_KINDS = ["REQUIRED", "OPTIONAL", "CONDITIONAL", "GENERATED"] as const;
export type ProcedureInputKind = (typeof PROCEDURE_INPUT_KINDS)[number];
export const PROCEDURE_FIELD_NAMES = ["INPUTS", "PRECONDITIONS", "STEPS", "DECISION_POINTS", "EXPECTED_OUTPUTS", "FAILURE_CONDITIONS", "RECOVERY", "VERIFICATION", "EXCEPTIONS"] as const;
export type ProcedureFieldName = (typeof PROCEDURE_FIELD_NAMES)[number];
export type ProcedureFieldState = "KNOWN" | "NOT_APPLICABLE" | "UNKNOWN";
export type ProcedureStepSource = "HUMAN_TAUGHT" | "APPROVED_SOURCE" | "AGENT_INFERRED";
export type ProcedureInput = Readonly<{ inputId: string; name: string; kind: ProcedureInputKind; derivable: boolean; provenanceId?: string }>;
export type ProcedureStep = Readonly<{ stepId: string; action: string; requires: readonly string[]; produces: readonly string[]; nextStepId?: string; provenance: Readonly<{ source: ProcedureStepSource; sourceId: string }> }>;
export type ProcedureDecisionPoint = Readonly<{ decisionId: string; condition: string; outcomes: Readonly<Record<string, string>>; provenanceId: string }>;
export type ProcedureFailureCondition = Readonly<{ failureId: string; trigger: string; severity: "BLOCKING" | "RECOVERABLE"; result: string }>;
export type ProcedureRecoveryAction = Readonly<{ recoveryId: string; action: "RETRY" | "ROLLBACK" | "RESTART_STEP" | "RETURN_TO_CHECKPOINT" | "REQUEST_INPUT" | "REQUEST_APPROVAL" | "USE_APPROVED_FALLBACK" | "ESCALATE" | "ABORT"; authorizedBy: string; appliesToFailureIds: readonly string[] }>;
export type ProcedureVerification = Readonly<{ verificationId: string; test: string; required: boolean; provenanceId: string }>;
export type ProcedureException = Readonly<{ exceptionId: string; trigger: string; scope: KnowledgeScopeReference; affectedStepIds: readonly string[]; replacementBehavior: string; authority: string; expiresAt?: string; provenanceId: string }>;
/** Structured procedural hypothesis. It represents knowledge only and never grants execution authority. */
export type ProcedureCandidate = Readonly<{ procedureId: string; version: number; name: string; purpose: string; scope: KnowledgeScopeReference; inputs: readonly ProcedureInput[]; preconditions: readonly string[]; steps: readonly ProcedureStep[]; decisionPoints: readonly ProcedureDecisionPoint[]; expectedOutputs: readonly string[]; failureConditions: readonly ProcedureFailureCondition[]; recovery: readonly ProcedureRecoveryAction[]; verification: readonly ProcedureVerification[]; exceptions: readonly ProcedureException[]; fieldStates: Readonly<Record<ProcedureFieldName, ProcedureFieldState>>; authority: "AGENT_INFERRED"; status: "DRAFT" | "INCOMPLETE" | "CANDIDATE"; teachingEventId: string; createdBy: ProvenanceActor; createdAt: string; immutable: true; executionPermissionGranted: false }>;
export type ProcedureCandidateInput = Omit<ProcedureCandidate, "authority" | "status" | "immutable" | "executionPermissionGranted">;
export type ProcedureCompletenessResult = Readonly<{ procedureId: string; status: "COMPLETE" | "INCOMPLETE"; missingFields: readonly ProcedureFieldName[]; violations: readonly string[]; persistenceEffect: "NONE"; authorityEffect: "UNCHANGED"; executionPermissionGranted: false }>;
export interface ProcedureCompletenessValidator { validate(candidate: ProcedureCandidate): ProcedureCompletenessResult; }
/** Procedure-specific comprehension evidence. It is distinct from the procedure definition and cannot authorize execution. */
export type ProcedureTeachBack = Readonly<{ teachBackId: string; procedureId: string; purpose: string; inputs: readonly string[]; preconditions: readonly string[]; steps: readonly string[]; decisions: readonly string[]; expectedOutputs: readonly string[]; failures: readonly string[]; recovery: readonly string[]; verification: readonly string[]; exceptions: readonly string[]; uncertainties: readonly string[]; generatedBy: ProvenanceActor; generatedAt: string; immutable: true }>;
export type ProcedureTeachBackEvaluation = Readonly<{ evaluationId: string; teachBackId: string; procedureId: string; outcome: "PASS" | "PARTIAL" | "CLARIFICATION_REQUIRED" | "FAIL"; missingSections: readonly string[]; findings: readonly string[]; persistenceEffect: "NONE"; authorityEffect: "UNCHANGED"; executionPermissionGranted: false }>;
export interface ProcedureTeachBackEvaluator { evaluate(teachBack: ProcedureTeachBack, procedure: ProcedureCandidate): ProcedureTeachBackEvaluation; }
export const PROCEDURE_REVIEW_ACTIONS = ["APPROVE", "MODIFY", "REJECT", "REQUEST_MORE_EVIDENCE", "NARROW_SCOPE", "ADD_EXCEPTION"] as const;
export type ProcedureReviewAction = (typeof PROCEDURE_REVIEW_ACTIONS)[number];
export type ProcedureHumanReview = Readonly<{ reviewId: string; procedureId: string; action: ProcedureReviewAction; actor: ProvenanceActor; note: string; reviewedAt: string; immutable: true }>;
/** A human-approved procedure definition remains non-executable until its separate execution authority is evaluated. */
export type HumanAuthorizedProcedure = Readonly<{ authorizedProcedureId: string; procedureId: string; reviewId: string; procedure: ProcedureCandidate; authority: "HUMAN_DIRECTIVE"; status: "PENDING_CONFLICT_AND_GATE"; authorizedBy: ProvenanceActor; authorizedAt: string; immutable: true; executionPermissionGranted: false }>;
export interface ProcedureHumanReviewRepository { append(review: ProcedureHumanReview): Promise<ProcedureHumanReview>; appendAuthorized(authorized: HumanAuthorizedProcedure): Promise<HumanAuthorizedProcedure>; list(procedureId: string): Promise<readonly ProcedureHumanReview[]>; }
export type DurableProcedure = Readonly<{ durableProcedureId: string; durableKnowledgeId: string; procedure: HumanAuthorizedProcedure["procedure"]; authorizedProcedureId: string; status: "ACTIVE" | "SUPERSEDED" | "SUSPENDED"; supersedesProcedureId?: string; createdAt: string; immutable: true; executionPermissionGranted: false }>;
export interface ProcedureRegistry { append(procedure: DurableProcedure): Promise<DurableProcedure>; list(): Promise<readonly DurableProcedure[]>; }
export type ProcedureSimulationInput = Readonly<{ inputs: Readonly<Record<string, unknown>>; satisfiedPreconditions: readonly string[]; decisionOutcomes?: Readonly<Record<string, string>>; applicableExceptionIds?: readonly string[] }>;
export type ProcedureSimulationResult = Readonly<{ durableProcedureId: string; status: "READY_FOR_AUTHORIZED_EXECUTION" | "DEFERRED"; missingInputs: readonly string[]; failedPreconditions: readonly string[]; unresolvedDecisionIds: readonly string[]; applicableExceptionIds: readonly string[]; plannedStepIds: readonly string[]; plannedVerificationIds: readonly string[]; persistenceEffect: "NONE"; authorityEffect: "UNCHANGED"; executionPermissionGranted: false; simulated: true }>;
export type ProcedureExecutionAuthorization = Readonly<{ authorizationId: string; procedureId: string; actor: ProvenanceActor; granted: boolean; grantedAt: string }>;
export type ProcedureExecutionEvent = Readonly<{ eventId: string; executionId: string; type: "STARTED" | "STEP_COMPLETED" | "FAILURE_DETECTED" | "RECOVERY_STARTED" | "RECOVERY_COMPLETED" | "VERIFICATION_PASSED" | "VERIFICATION_FAILED" | "COMPLETED" | "ABORTED"; detail: string; occurredAt: string; immutable: true }>;
export type ProcedureExecutionStartResult = Readonly<{ executionId?: string; status: "STARTED" | "BLOCKED"; reason: "EXECUTION_AUTHORIZATION_REQUIRED" | "SIMULATION_NOT_READY" | "EXECUTION_STARTED"; persistenceEffect: "CREATED" | "NONE"; authorityEffect: "UNCHANGED"; executionPermissionGranted: false }>;
export interface ProcedureExecutionLedger { append(event: ProcedureExecutionEvent): Promise<ProcedureExecutionEvent>; list(executionId: string): Promise<readonly ProcedureExecutionEvent[]>; }
export type ProcedureArtifactRecord = Readonly<{ artifactId: string; artifactType: string; subjectId: string; payload: unknown; createdAt: string }>;
export interface ProcedureArtifactStore { append(artifact: ProcedureArtifactRecord): Promise<ProcedureArtifactRecord>; }
