import type { ProvenanceActor } from "./provenance";
import type { StrategyEvaluationProfile } from "./strategyEvaluation";
import type { MetricObservation } from "./strategyEvaluation";
import type { StrategySelectionRequest } from "./strategySelection";

/** Phase 40 uses multi-label objective descriptions; it never pretends that a single label is sufficient. */
export const LEARNING_OBJECTIVE_TYPES = ["FACTUAL", "CONCEPTUAL", "PROCEDURAL", "DIAGNOSTIC", "DECISION_JUDGMENT", "PRINCIPLE", "DISCRIMINATION", "PROBLEM_SOLVING", "CREATIVE", "METACOGNITIVE"] as const;
export type LearningObjectiveType = typeof LEARNING_OBJECTIVE_TYPES[number];
export type MasteryLevel = "NOVICE" | "DEVELOPING" | "COMPETENT" | "ADVANCED" | "MASTERED";
export type SelectionRisk = "LOW" | "MEDIUM" | "HIGH" | "SECURITY_CRITICAL";

export type LearningObjectiveProfile = Readonly<{
  profileId: string; objectiveId: string; domain: string; primaryType: LearningObjectiveType | null;
  typeConfidence: number; secondaryTypes: readonly LearningObjectiveType[]; currentMastery: MasteryLevel;
  targetMastery: MasteryLevel; risk: SelectionRisk; transferRequirement: "LOW" | "MEDIUM" | "HIGH";
  retentionRequirement: "LOW" | "MEDIUM" | "HIGH"; prerequisites: readonly string[]; knowledgeGapIds: readonly string[];
  constraints: readonly string[]; classifierVersion: string; createdAt: string; immutable: true;
}>;

export type StrategySelectionPolicy = Readonly<{
  policyVersion: string; minimumClassificationConfidence: number; minimumEvidenceByRisk: Readonly<Record<SelectionRisk, StrategyEvaluationProfile["confidence"] | "NONE">>;
  weights: Readonly<{ objectiveFit: number; historicalEffectiveness: number; transfer: number; retention: number; learnerCompatibility: number; evidenceStrength: number; timeCost: number; tokenCost: number; toolCost: number; failureRisk: number }>;
  exploration: Readonly<{ allowedRisk: "LOW" | "MEDIUM"; maximumCandidateScoreDelta: number; requiresBaseline: true }>;
}>;

export type StrategySelectionScore = Readonly<{
  strategyId: string; eligible: boolean; total: number | null; components: Readonly<Record<string, number>>;
  evidenceProfileIds: readonly string[]; evidenceConfidence: StrategyEvaluationProfile["confidence"] | "UNTESTED";
  disqualificationReasons: readonly string[]; rationale: readonly string[];
}>;

export type Phase40SelectionStatus = "RECOMMENDED" | "REQUIRES_OBJECTIVE_CLARIFICATION" | "BLOCKED_BY_POLICY" | "NO_ELIGIBLE_STRATEGY";
export type StrategySelectionRecord = Readonly<{
  selectionId: string; requestId: string; objectiveProfileId: string; selectedStrategyId: string | null;
  mode: "EXPLOIT" | "EXPLORE" | "BASELINE"; status: Phase40SelectionStatus; scores: readonly StrategySelectionScore[];
  rationale: readonly string[]; policyVersion: string; classifierVersion: string; registryVersion: string;
  evidenceSnapshotId: string; createdAt: string; immutable: true; recommendationOnly: true;
  executionPermissionGranted: false; authorityEffect: "UNCHANGED";
}>;

export type StrategyOverride = Readonly<{
  overrideId: string; selectionId: string; selectedStrategyId: string; overriddenStrategyId: string | null;
  reason: string; expectedOutcome: string; actor: ProvenanceActor; createdAt: string; immutable: true;
  requiresApprovedPlan: true; executionPermissionGranted: false; authorityEffect: "UNCHANGED";
}>;
export type StrategyCompositionPlan = Readonly<{
  compositionPlanId: string; objectiveProfileId: string;
  components: readonly Readonly<{ objectiveType: LearningObjectiveType; prerequisiteComponentIds: readonly string[]; selectionId: string; strategyId: string }> [];
  status: "PROPOSED"; createdAt: string; requiresApprovedPlan: true; executionPermissionGranted: false; authorityEffect: "UNCHANGED";
}>;
export type StrategyEscalation = Readonly<{
  escalationId: string; selectionId: string; level: "LIGHTWEIGHT" | "ENHANCED" | "INTENSIVE" | "HUMAN_INTERVENTION";
  trigger: "EVALUATION_FAILURE" | "REPEATED_FAILURE" | "PREREQUISITE_FAILURE" | "SAFETY_CRITICAL_FAILURE";
  rationale: string; createdAt: string; recommendationOnly: true; requiresApprovedPlan: true; executionPermissionGranted: false; authorityEffect: "UNCHANGED";
}>;
/** The Phase 40-to-27 handoff. It is a proposed curriculum input, not an approval, lease, or executable curriculum. */
export type StrategyCurriculumProposal = Readonly<{
  proposalId: string; selectionId: string; objectiveProfileId: string; objectiveId: string; goal: string;
  strategyIds: readonly string[]; requiredEvaluationDimensions: readonly ("IMMEDIATE" | "TRANSFER" | "RETENTION" | "CALIBRATION")[];
  status: "AWAITING_HUMAN_APPROVAL"; createdAt: string; immutable: true; executionAuthorized: false; requiresExecutionLease: true; authorityEffect: "UNCHANGED";
}>;
export type StrategyApprovalBridge = Readonly<{
  bridgeId: string; curriculumProposalId: string; selectionId: string; learningProposalId: string; approvalId: string; leaseId: string;
  approvedBy: ProvenanceActor; approvedAt: string; immutable: true; executionAuthorized: true; authorityEffect: "UNCHANGED";
}>;
export type StrategyCurriculumMaterialization = Readonly<{
  materializationId: string; bridgeId: string; selectionId: string; graphVersionId: string; curriculumId: string;
  resolvedSkillIds: readonly string[]; createdAt: string; immutable: true; executionAuthorized: false; authorityEffect: "UNCHANGED";
}>;
/** Canonical outcome contract prevents a strategy from optimizing easy, short-term proxy measures. */
export type SelectionOutcome = Readonly<{
  outcomeId: string; selectionId: string; strategyId: string; overrideId: string | null; curriculumId: string; evaluationId: string; executionId: string; metrics: readonly MetricObservation[]; immediateEvidenceIds: readonly string[]; novelApplicationEvidenceIds: readonly string[];
  retentionEvidenceIds: readonly string[]; calibrationEvidenceIds: readonly string[]; invalidEvidenceIds: readonly string[];
  status: "COMPLETE" | "PARTIAL" | "INVALID"; createdAt: string; immutable: true; recommendationOnly: true;
  executionPermissionGranted: false; authorityEffect: "UNCHANGED";
}>;
export type StrategySelectionComparison = Readonly<{
  cohort: Readonly<{ primaryType: LearningObjectiveType | null; risk: SelectionRisk; currentMastery: MasteryLevel }>; system: Readonly<{ sampleSize: number; metrics: Readonly<Record<string, number | null>> }>; humanOverride: Readonly<{ sampleSize: number; metrics: Readonly<Record<string, number | null>> }>;
  confidence: "INSUFFICIENT" | "EXPERIMENTAL" | "PRELIMINARY" | "SUPPORTED"; interpretation: "OBSERVED_ASSOCIATION"; causalClaim: false; reasons: readonly string[];
}>;
export type StrategyReselection = Readonly<{
  reselectionId: string; priorSelectionId: string; failureAttributionId: string; diagnosedFailure: "PREREQUISITE" | "TRANSFER" | "RETENTION" | "CALIBRATION" | "ENGAGEMENT" | "INVALID_EVALUATION";
  recommendation: "REMEDIATE_PREREQUISITE" | "INCREASE_NOVEL_APPLICATION" | "ADD_DELAYED_RECALL" | "ADD_CALIBRATION_FEEDBACK" | "HUMAN_REVIEW";
  createdAt: string; recommendationOnly: true; executionPermissionGranted: false; authorityEffect: "UNCHANGED";
}>;
export type StrategySelectionArtifact = Readonly<{ artifactId: string; artifactType: "OBJECTIVE_PROFILE" | "SELECTION" | "OVERRIDE" | "RESELECTION"; subjectId: string; payload: unknown; createdAt: string }>;
export interface StrategySelectionStore { append(artifact: StrategySelectionArtifact): Promise<StrategySelectionArtifact>; listArtifacts(subjectId: string): Promise<readonly StrategySelectionArtifact[]>; }

export type StrategySelectionEngineInput = Readonly<{
  selectionId: string; request: StrategySelectionRequest; profile: LearningObjectiveProfile; policy: StrategySelectionPolicy;
  registryVersion: string; evidenceSnapshotId: string; profiles: readonly StrategyEvaluationProfile[]; createdAt: string;
}>;
