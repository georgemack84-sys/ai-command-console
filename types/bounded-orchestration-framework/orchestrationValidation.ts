import type { ApprovalAwareRoutingResult } from "@/types/approval-aware-coordination-router";
import type { ConstitutionalCoordinationRecord } from "@/types/constitutional-coordination";
import type { AntiEmergenceValidationResult } from "@/types/coordination-containment";
import type { HumanSupremacyRecord } from "@/types/human-supremacy";
import type { BoundedOrchestrationError } from "./orchestrationBoundary";
import type { BoundedOrchestrationAuthorityContract } from "./orchestrationBoundary";
import type { BoundedOrchestrationCeiling } from "./orchestrationContainment";
import type { OrchestrationDelegationAnalysis } from "./orchestrationDelegation";
import type { OrchestrationIsolationAssessment } from "./orchestrationIsolation";
import type { BoundedOrchestrationChronology, BoundedOrchestrationState } from "./orchestrationLineage";
import type { BoundedOrchestrationReplayRecord } from "./orchestrationReplay";
import type { BoundedOrchestrationTopology } from "./orchestrationTopology";

export type BoundedOrchestrationValidation = Readonly<{
  valid: boolean;
  failClosed: boolean;
  replaySafe: boolean;
  governanceBound: boolean;
  containmentInherited: AntiEmergenceValidationResult["containmentState"];
  recursiveDelegation: OrchestrationDelegationAnalysis;
  isolation: OrchestrationIsolationAssessment;
  blockedReasons: readonly string[];
  errors: readonly BoundedOrchestrationError[];
}>;

export type BoundedOrchestrationInput = Readonly<{
  orchestrationId: string;
  coordinationRecord: ConstitutionalCoordinationRecord;
  routingResult: ApprovalAwareRoutingResult;
  containmentValidation: AntiEmergenceValidationResult;
  containmentHash: string;
  createdAt: string;
  existingChronology?: BoundedOrchestrationChronology;
  humanSupremacyRecord?: HumanSupremacyRecord;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type BoundedOrchestrationRecord = Readonly<{
  orchestrationId: string;
  coordinationId: string;
  proposalId: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  escalationSnapshotId?: string;
  containmentState: AntiEmergenceValidationResult["containmentState"];
  orchestrationState: BoundedOrchestrationState;
  ceiling: BoundedOrchestrationCeiling;
  authorityContract: BoundedOrchestrationAuthorityContract;
  topology: BoundedOrchestrationTopology;
  containment: Readonly<{
    inheritedState: AntiEmergenceValidationResult["containmentState"];
    ceilingLevel: BoundedOrchestrationCeiling;
  }>;
  isolation: Readonly<{
    isolated: boolean;
    governanceScopeId: string;
    replayScopeId: string;
    approvalScopeId?: string;
    escalationScopeId?: string;
    containmentScopeId: string;
    coordinationScopeId: string;
    missionScopeId: string;
    leakage: readonly string[];
  }>;
  state: BoundedOrchestrationState;
  validation: BoundedOrchestrationValidation;
  replay: BoundedOrchestrationReplayRecord;
  chronology: BoundedOrchestrationChronology;
  lineage: BoundedOrchestrationChronology;
  deterministicHash: string;
  warnings: readonly string[];
  errors: readonly BoundedOrchestrationError[];
  createdAt: string;
  derivedOnly: true;
}>;
