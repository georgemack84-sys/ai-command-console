import type { ConstitutionalAutonomyReadinessGateRecord } from "@/services/constitutional-autonomy-readiness-gate";
import type { ConstitutionalEscalationRecord } from "@/services/constitutional-escalation-layer";
import type { CorrelationComputation } from "@/services/intent-correlation-engine/correlationTypes";
import type { IntentCoordinationGovernanceRecord } from "@/types/intent-coordination-governance-core";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { BoundedHandoffContractRecord } from "./boundedHandoff";
import type { LifecycleContainmentBoundary } from "./lifecycleBoundary";
import type {
  ApprovalValidationAssertion,
  EscalationValidationAssertion,
  GovernanceValidationAssertion,
  ReplayValidationAssertion,
} from "./lifecycleGovernance";
import type { LifecycleLineageLedger } from "./lifecycleLineage";
import type { LifecycleReplayBinding } from "./lifecycleReplay";
import type { BoundedIntentLifecycleState } from "./lifecycleState";

export type BoundedCoordinationGateRecord = Readonly<{
  gateId: string;
  valid: boolean;
  coordinationState: IntentCoordinationGovernanceRecord["state"];
  derivedOnly: true;
  errors: readonly import("./lifecycleErrors").LifecycleError[];
}>;

export type LifecycleTransitionRecord = Readonly<{
  transitionId: string;
  proposalId: string;
  currentState: BoundedIntentLifecycleState;
  requestedState: BoundedIntentLifecycleState;
  resultingState: BoundedIntentLifecycleState;
  governanceDecision: "ALLOW" | "DENY";
  boundary: LifecycleContainmentBoundary;
  replayBinding: LifecycleReplayBinding;
  coordinationGate: BoundedCoordinationGateRecord;
  handoff?: BoundedHandoffContractRecord;
  createdAt: string;
  lifecycleHash: string;
  immutable: true;
}>;

export type LifecycleTransitionRequest = Readonly<{
  proposal: ProposalRecord;
  readinessGate: ConstitutionalAutonomyReadinessGateRecord;
  escalation: ConstitutionalEscalationRecord;
  coordinationRecord: IntentCoordinationGovernanceRecord;
  correlationComputation: CorrelationComputation;
  currentRecord: LifecycleTransitionRecord;
  currentState: BoundedIntentLifecycleState;
  nextState: BoundedIntentLifecycleState;
  governanceValidation: GovernanceValidationAssertion;
  replayValidation: ReplayValidationAssertion;
  escalationValidation: EscalationValidationAssertion;
  approvalValidation: ApprovalValidationAssertion;
  boundary: LifecycleContainmentBoundary;
  createdAt: string;
  existingLineage?: LifecycleLineageLedger;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type LifecycleComputation = Readonly<{
  record: LifecycleTransitionRecord;
  lineage: LifecycleLineageLedger;
  auditEvents: readonly import("./lifecycleLineage").LifecycleAuditEvent[];
  warnings: readonly string[];
  errors: readonly import("./lifecycleErrors").LifecycleError[];
}>;
