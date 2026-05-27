import type { ConstitutionalAuditEpisodeResult } from "@/types/constitutional-audit-episode";
import type { TelemetrySeverity } from "./telemetrySeverity";
import type { TelemetryLineageLedger, TelemetryLedgerEntry } from "./telemetryLineage";
import type { TelemetryEvidence } from "./telemetryEvidence";
import type { TelemetryReplayVerification } from "./telemetryReplay";
import type { TelemetryGovernanceBinding } from "./telemetryGovernance";
import type { ContainmentPressureSignal } from "./telemetryContainment";
import type { TelemetryEscalationRecord } from "./telemetryEscalation";
import type { TelemetryApprovalRecord } from "./telemetryApproval";
import type { TelemetryConfidenceRecord } from "./telemetryConfidence";
import type { TelemetryError } from "./telemetryErrors";

export interface ConstitutionalTelemetryAuthorityContract {
  readonly executionAuthority: false;
  readonly orchestrationAuthority: false;
  readonly schedulingAuthority: false;
  readonly runtimeMutationAuthority: false;
  readonly governanceMutationAuthority: false;
  readonly approvalAuthority: false;
  readonly escalationAuthority: false;
  readonly authorityInheritance: false;
  readonly adaptiveAutonomyAuthority: false;
}

export interface ConstitutionalTelemetryEvent {
  readonly telemetryId: string;
  readonly domain:
    | "replay"
    | "governance"
    | "recommendation"
    | "approval"
    | "escalation"
    | "confidence"
    | "containment";
  readonly severity: TelemetrySeverity;
  readonly sourceId: string;
  readonly snapshotId: string;
  readonly governanceSnapshotId: string;
  readonly replayLineageHash: string;
  readonly escalationLineageHash: string;
  readonly approvalLineageHash: string;
  readonly anomalyDetected: boolean;
  readonly escalationRequired: boolean;
  readonly freezeRequired: boolean;
  readonly forensicHash: string;
  readonly createdAt: string;
}

export type TelemetryMetrics = Readonly<{
  replay_stability_score: number;
  governance_violation_rate: number;
  recommendation_anomaly_rate: number;
  approval_instability_score: number;
  escalation_failure_rate: number;
  confidence_volatility_score: number;
  containment_pressure_score: number;
  forensic_reconstruction_success_rate: number;
}>;

export type ConstitutionalTelemetryInput = Readonly<{
  telemetryId: string;
  constitutionalAuditEpisodeResult: ConstitutionalAuditEpisodeResult;
  deterministicSeed: string;
  validatorVersionId: string;
  createdAt: string;
  existingLineage?: TelemetryLineageLedger;
  existingReplayLedger?: readonly TelemetryLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type ConstitutionalTelemetryRecord = Readonly<{
  telemetryId: string;
  coordinationId: string;
  episodeId: string;
  simulationId: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  telemetryState: "stable" | "elevated" | "frozen" | "blocked" | "disputed";
  replaySafe: boolean;
  failClosed: boolean;
  createdAt: string;
}>;

export type ConstitutionalTelemetryResult = Readonly<{
  record: ConstitutionalTelemetryRecord;
  authorityContract: ConstitutionalTelemetryAuthorityContract;
  events: readonly ConstitutionalTelemetryEvent[];
  replayVerification: TelemetryReplayVerification;
  governanceBinding: TelemetryGovernanceBinding;
  containmentPressure: ContainmentPressureSignal;
  escalationRecords: readonly TelemetryEscalationRecord[];
  approvalRecords: readonly TelemetryApprovalRecord[];
  confidenceRecords: readonly TelemetryConfidenceRecord[];
  evidence: TelemetryEvidence;
  lineage: TelemetryLineageLedger;
  replayLedger: readonly TelemetryLedgerEntry[];
  metrics: TelemetryMetrics;
  errors: readonly TelemetryError[];
  warnings: readonly string[];
  deterministicHash: string;
  derivedOnly: true;
}>;
