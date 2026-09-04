import type { ProvenanceActor } from "./provenance";
import type { SkillStatus, SkillType } from "./skillRegistry";

/**
 * Phase 19 graph records intentionally reference, but do not duplicate or
 * mutate, the canonical Phase 18 Skill Registry.
 */
export type CanonicalSkillReference = Readonly<{
  skillId: string;
}>;

export type SkillGraphNode = Readonly<{
  skill: CanonicalSkillReference;
  name: string;
  skillType: SkillType;
  canonicalStatus: SkillStatus;
}>;

export const SKILL_DEPENDENCY_TYPES = ["PREREQUISITE", "SUPPORTING", "RELATED"] as const;
export type SkillDependencyType = (typeof SKILL_DEPENDENCY_TYPES)[number];

export const SKILL_DEPENDENCY_LIFECYCLES = ["CANDIDATE", "ACTIVE", "SUPERSEDED", "REJECTED"] as const;
export type SkillDependencyLifecycle = (typeof SKILL_DEPENDENCY_LIFECYCLES)[number];

export type SkillDependencyProvenance = Readonly<{
  provenanceIds: readonly string[];
  assertedBy: ProvenanceActor;
  assertedAt: string;
}>;

/**
 * An edge runs from the required/supporting capability to the capability it
 * affects. `requiredMasteryThreshold` is meaningful only for prerequisites.
 */
export type SkillDependency = Readonly<{
  dependencyId: string;
  prerequisite: CanonicalSkillReference;
  dependent: CanonicalSkillReference;
  relationshipType: SkillDependencyType;
  strength: number;
  requiredMasteryThreshold: number | null;
  evidenceIds: readonly string[];
  provenance: SkillDependencyProvenance;
  lifecycle: SkillDependencyLifecycle;
  graphVersionId: string;
  rationale: string;
}>;

export type SkillDependencyValidation = Readonly<{
  dependencyId: string;
  valid: boolean;
  reasonCodes: readonly string[];
}>;

export type SkillGraphVersion = Readonly<{
  graphVersionId: string;
  previousGraphVersionId: string | null;
  dependencyIds: readonly string[];
  changeReason: string;
  validationStatus: "PASSED";
  createdBy: ProvenanceActor;
  createdAt: string;
}>;

export type SkillGraphArtifactRecord = Readonly<{
  artifactId: string;
  artifactType: "DEPENDENCY_CANDIDATE" | "DEPENDENCY_ADMITTED" | "DEPENDENCY_REJECTED" | "DEPENDENCY_SUPERSEDED" | "GRAPH_VERSION" | "REMEDIATION_PLAN_CREATED" | "REMEDIATION_PLAN_ACTIVATED";
  subjectId: string;
  payload: unknown;
  createdAt: string;
}>;

/** The immutable event history is authoritative; active graph views are projections. */
export interface SkillGraphArtifactStore {
  append(artifact: SkillGraphArtifactRecord): Promise<SkillGraphArtifactRecord>;
  listWorkspaceArtifacts(): Promise<readonly SkillGraphArtifactRecord[]>;
}

export type SkillGraphProjection = Readonly<{
  dependencies: readonly SkillDependency[];
  latestVersion: SkillGraphVersion | null;
}>;

export type SkillGraphIntegrityViolationCode =
  | "CANONICAL_SKILL_MISSING"
  | "DUPLICATE_DEPENDENCY"
  | "HARD_PREREQUISITE_CYCLE"
  | "SELF_DEPENDENCY_FORBIDDEN"
  | "DEPENDENCY_STRENGTH_INVALID"
  | "PREREQUISITE_THRESHOLD_INVALID"
  | "NON_PREREQUISITE_THRESHOLD_FORBIDDEN"
  | "DEPENDENCY_EVIDENCE_REQUIRED"
  | "DEPENDENCY_PROVENANCE_REQUIRED"
  | "GRAPH_VERSION_AND_RATIONALE_REQUIRED"
  | "CANONICAL_SKILL_REFERENCE_REQUIRED";

export type SkillGraphIntegrityViolation = Readonly<{
  code: SkillGraphIntegrityViolationCode;
  dependencyIds: readonly string[];
  detail: string;
}>;

export type SkillGraphIntegrityReport = Readonly<{
  valid: boolean;
  violations: readonly SkillGraphIntegrityViolation[];
}>;

export type SkillGraphTraversalEntry = Readonly<{
  skillId: string;
  depth: number;
  viaDependencyIds: readonly string[];
}>;

export type SkillGraphDependencyPath = Readonly<{
  skillIds: readonly string[];
  dependencyIds: readonly string[];
}>;

export type SkillGraphTraversal = Readonly<{
  direct: readonly SkillGraphTraversalEntry[];
  transitive: readonly SkillGraphTraversalEntry[];
  paths: readonly SkillGraphDependencyPath[];
}>;

export const SKILL_GRAPH_READINESS_STATES = ["LOCKED", "READY", "PROVISIONAL", "MASTERED", "DEGRADED", "REMEDIATING", "REVALIDATION_REQUIRED"] as const;
export type SkillGraphReadinessState = (typeof SKILL_GRAPH_READINESS_STATES)[number];

export type SkillPrerequisiteHealth = Readonly<{
  dependencyId: string;
  skillId: string;
  requiredMasteryThreshold: number;
  observedMastery: number | null;
  satisfied: boolean;
  reason: string;
}>;

/** Derived availability only; it does not change the canonical skill status or mastery. */
export type SkillReadiness = Readonly<{
  skillId: string;
  state: SkillGraphReadinessState;
  blocked: boolean;
  canonicalStatus: import("./skillRegistry").SkillStatus | null;
  prerequisiteHealth: readonly SkillPrerequisiteHealth[];
  reason: string;
}>;

export const FAILURE_ATTRIBUTIONS = ["TARGET_SKILL_DEFICIENCY", "PREREQUISITE_DEFICIENCY", "PROCEDURE_FAILURE", "KNOWLEDGE_GAP", "MISCLASSIFIED_TASK", "BAD_REQUIREMENTS", "INSUFFICIENT_CONTEXT", "EXECUTION_ERROR", "EVALUATION_ERROR", "UNKNOWN"] as const;
export type FailureAttribution = (typeof FAILURE_ATTRIBUTIONS)[number];

export type FailureAttributionAssessment = Readonly<{
  attribution: FailureAttribution;
  status: "SUPPORTED" | "UNRESOLVED" | "NOT_SUPPORTED";
  reason: string;
}>;

export type SkillBottleneckHypothesis = Readonly<{
  targetSkillId: string;
  prerequisiteSkillId: string;
  dependencyId: string;
  deficit: number;
  score: number;
  graphPath: readonly string[];
  evidenceIds: readonly string[];
  attribution: "PREREQUISITE_DEFICIENCY";
  confidence: "LOW" | "MEDIUM";
  reason: string;
}>;

export type SkillBottleneckDiagnosis = Readonly<{
  status: "RECOMMENDATION" | "INSUFFICIENT_EVIDENCE" | "NOT_LOCALIZED";
  targetSkillId: string;
  hypotheses: readonly SkillBottleneckHypothesis[];
  attributionAssessments: readonly FailureAttributionAssessment[];
  reason: string;
}>;

export type RemediationPlanStatus = "PROPOSED" | "ACTIVE" | "COMPLETED" | "ABANDONED";
export type RemediationPlanStep = Readonly<{
  stepId: string;
  action: "PRACTICE" | "PREREQUISITE_EVALUATION" | "RETEST_TARGET";
  skillId: string;
  procedureIds: readonly string[];
  exampleIds: readonly string[];
  evidenceIds: readonly string[];
  successCriterion: string;
}>;
/** A plan is an inspectable learning proposal, never an implicit mastery adjustment. */
export type SkillRemediationPlan = Readonly<{
  planId: string;
  targetSkillId: string;
  bottleneckSkillId: string;
  basedOnDependencyId: string;
  diagnosisEvidenceIds: readonly string[];
  graphPath: readonly string[];
  graphVersionId: string;
  status: RemediationPlanStatus;
  steps: readonly RemediationPlanStep[];
  createdBy: import("./provenance").ProvenanceActor;
  createdAt: string;
  executionPermissionGranted: false;
}>;

export type SkillRemediationPlanActivation = Readonly<{
  planId: string;
  actor: import("./provenance").ProvenanceActor;
  activatedAt: string;
}>;

export type SkillGraphRiskTrigger = "WEAKENED" | "STALE" | "EVIDENCE_REVOKED";
export type SkillBlastRadiusEntry = Readonly<{
  skillId: string;
  depth: number;
  dependencyIds: readonly string[];
  reevaluationPriority: number;
  revalidationRecommended: true;
  reason: string;
}>;
export type SkillBlastRadiusAnalysis = Readonly<{
  sourceSkillId: string;
  trigger: SkillGraphRiskTrigger;
  status: "POTENTIAL_IMPACT" | "NO_IMPACT" | "INSUFFICIENT_EVIDENCE";
  directlyAffected: readonly SkillBlastRadiusEntry[];
  potentiallyAffected: readonly SkillBlastRadiusEntry[];
  historicalMasteryChanged: false;
  reason: string;
}>;

export type SkillDependencyCandidateDiscovery = Readonly<{
  candidate: SkillDependency;
  discoveryMethod: "HUMAN_ASSERTION" | "COUNTERFACTUAL_EVIDENCE" | "TEACH_BACK_UNCERTAINTY";
  supportingEvidenceIds: readonly string[];
}>;
export type SkillDependencyHumanReview = Readonly<{
  reviewId: string;
  dependencyId: string;
  decision: "APPROVE" | "REJECT" | "SUPERSEDE";
  actor: import("./provenance").ProvenanceActor;
  reason: string;
  reviewedAt: string;
}>;
export type SkillDependencySupersession = Readonly<{
  supersessionId: string;
  supersededDependencyId: string;
  replacementDependencyId: string;
  reviewId: string;
  graphVersionId: string;
  createdAt: string;
}>;

export type SkillGraphInspectionView = Readonly<{
  targetSkillId: string | null;
  readiness: SkillReadiness | null;
  upstream: SkillGraphTraversal | null;
  downstream: SkillGraphTraversal | null;
  remediationPlans: readonly SkillRemediationPlan[];
  versions: readonly SkillGraphVersion[];
}>;
