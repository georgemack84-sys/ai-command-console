import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { AntiEmergenceResult } from "@/services/anti-emergence-constitutional-containment/antiEmergenceStateTypes";
import type { ConstitutionalCertificationResult } from "@/services/constitutional-certification/certificationStateTypes";
import type { ConstitutionalReadinessResult } from "@/services/constitutional-readiness-scoring/readinessStateTypes";
import type { ConstitutionalReplayStabilityResult } from "@/services/constitutional-replay-stability/replayStateTypes";
import type { ConstitutionalRuntimeSimulationResult } from "@/services/constitutional-runtime-simulation/simulationStateTypes";
import type { ConstitutionalTelemetryResult } from "@/services/constitutional-telemetry/telemetryStateTypes";
import type { EscalationDeterminismResult } from "@/services/escalation-determinism/escalationStateTypes";
import type { HumanSupremacyEnforcementResult } from "@/services/human-supremacy-enforcement/supremacyStateTypes";
import type { RuntimeAdmissibilityResult } from "@/services/runtime-admissibility/runtimeAdmissibilityStateTypes";

export type DecisionIntentType =
  | "recommendation"
  | "proposal"
  | "bounded_plan"
  | "risk_interpretation"
  | "confidence_estimate";

export type IntentRiskLevel = "low" | "medium" | "high" | "critical";

export type DecisionIntentBoundaryErrorCode =
  | "DECISION_INTENT_SCHEMA_INVALID"
  | "DECISION_INTENT_EXECUTION_SEMANTICS"
  | "DECISION_INTENT_RUNTIME_BINDING"
  | "DECISION_INTENT_SCHEDULER_SEMANTICS"
  | "DECISION_INTENT_ORCHESTRATION_SEMANTICS"
  | "DECISION_INTENT_HIDDEN_EXECUTION"
  | "DECISION_INTENT_IMPLICIT_DISPATCH"
  | "DECISION_INTENT_CAPABILITY_MUTATION"
  | "DECISION_INTENT_AUTHORITY_EXPANSION"
  | "DECISION_INTENT_GOVERNANCE_VIOLATION"
  | "DECISION_INTENT_APPROVAL_DEPENDENCY_INVALID"
  | "DECISION_INTENT_OPERATOR_OVERSIGHT_MISSING"
  | "DECISION_INTENT_ADVISORY_ONLY_VIOLATION"
  | "DECISION_INTENT_REPLAY_INVALID"
  | "DECISION_INTENT_HISTORICAL_REPLAY_INVALID"
  | "DECISION_INTENT_LINEAGE_GAP"
  | "DECISION_INTENT_NONDETERMINISTIC"
  | "DECISION_INTENT_DRIFT_DETECTED"
  | "DECISION_INTENT_SEMANTIC_DRIFT"
  | "DECISION_INTENT_CONTAINMENT_FAILURE"
  | "DECISION_INTENT_GOVERNANCE_BINDING_INVALID"
  | "DECISION_INTENT_REPLAY_BINDING_INVALID"
  | "DECISION_INTENT_ISOLATION_VIOLATION"
  | "DECISION_INTENT_AUTHORITY_CROSSOVER"
  | "DECISION_INTENT_EXECUTION_BLOCKED";

export type DecisionIntentBoundaryError = Readonly<{
  code: DecisionIntentBoundaryErrorCode;
  message: string;
  path: string;
}>;

export type DecisionIntentArtifact = Readonly<{
  intentId: string;
  schemaVersion: string;
  intentType: DecisionIntentType;
  advisoryOnly: true;
  executable: false;
  executionAuthorized: false;
  orchestrationAllowed: false;
  runtimeMutationAllowed: false;
  authorityMutationAllowed: false;
  governanceMutationAllowed: false;
  schedulerRegistrationAllowed: false;
  operatorReviewRequired: true;
  summary: string;
  evidenceLineage: readonly string[];
  governanceLineage: readonly string[];
  proposalLineage: readonly string[];
  replayLineage: readonly string[];
  approvalDependencies: readonly string[];
  risk: Readonly<{
    level: IntentRiskLevel;
    factors: readonly string[];
  }>;
  confidence: Readonly<{
    score: number;
    reasoning: readonly string[];
    uncertaintyFactors: readonly string[];
  }>;
  constitutionalBoundaryState: Readonly<{
    containsExecutionSemantics: false;
    containsRuntimeBindings: false;
    containsSchedulerBindings: false;
    containsOrchestrationBindings: false;
    containsAuthorityExpansion: false;
    containsCapabilityMutation: false;
    containsHiddenDispatch: false;
    containmentVerified: boolean;
  }>;
  deterministicHash: string;
  createdAt: string;
}>;

export type DecisionIntentBoundaryInput = Readonly<{
  intentId: string;
  schemaVersion: string;
  intentType: DecisionIntentType;
  summary: string;
  evidenceLineage: readonly string[];
  governanceLineage: readonly string[];
  proposalLineage: readonly string[];
  replayLineage: readonly string[];
  approvalDependencies: readonly string[];
  constitutionalCertificationResult: ConstitutionalCertificationResult;
  constitutionalReadinessResult: ConstitutionalReadinessResult;
  constitutionalReplayResult: ConstitutionalReplayStabilityResult;
  humanSupremacyResult: HumanSupremacyEnforcementResult;
  escalationDeterminismResult: EscalationDeterminismResult;
  antiEmergenceResult: AntiEmergenceResult;
  runtimeAdmissibilityResult: RuntimeAdmissibilityResult;
  constitutionalTelemetryResult: ConstitutionalTelemetryResult;
  constitutionalRuntimeSimulationResult: ConstitutionalRuntimeSimulationResult;
  deterministicSeed: string;
  validatorVersionId: string;
  createdAt: string;
  existingLineage?: IntentLineageLedger;
  existingReplayLedger?: readonly IntentLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type IntentSemanticScanRecord = Readonly<{
  matchedTerms: readonly string[];
  triggered: boolean;
  deterministicHash: string;
}>;

export type IntentPolicyRecord = Readonly<{
  advisoryOnly: true;
  operatorReviewRequired: true;
  failClosedOnDetection: true;
  deterministicHash: string;
}>;

export type IntentAggregationRecord = Readonly<{
  proposalScore: number;
  confidenceScore: number;
  riskLevel: IntentRiskLevel;
  failClosed: boolean;
  deterministicHash: string;
}>;

export type IntentEvidence = Readonly<{
  evidenceId: string;
  intentId: string;
  evidenceRefs: readonly string[];
  reasons: readonly string[];
  evidenceHash: string;
}>;

export type IntentLineageEntry = Readonly<{
  entryId: string;
  intentId: string;
  coordinationId: string;
  intentType: DecisionIntentType;
  failClosed: boolean;
  createdAt: string;
  deterministicHash: string;
}>;

export type IntentLineageLedger = Readonly<{
  entries: readonly IntentLineageEntry[];
  lineageHash: string;
}>;

export type IntentLedgerEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type DecisionIntentBoundaryResult = Readonly<{
  artifact: DecisionIntentArtifact;
  policy: IntentPolicyRecord;
  aggregation: IntentAggregationRecord;
  executionSemantics: IntentSemanticScanRecord;
  runtimeBindings: IntentSemanticScanRecord;
  schedulerSemantics: IntentSemanticScanRecord;
  orchestrationSemantics: IntentSemanticScanRecord;
  hiddenExecutionIntent: IntentSemanticScanRecord;
  implicitDispatch: IntentSemanticScanRecord;
  capabilityMutation: IntentSemanticScanRecord;
  authorityExpansionIntent: IntentSemanticScanRecord;
  evidence: IntentEvidence;
  lineage: IntentLineageLedger;
  replayLedger: readonly IntentLedgerEntry[];
  warnings: readonly string[];
  errors: readonly DecisionIntentBoundaryError[];
  deterministicHash: string;
  derivedOnly: true;
}>;
