import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { AntiEmergenceResult } from "@/services/anti-emergence-constitutional-containment/antiEmergenceStateTypes";
import type { ConstitutionalReplayStabilityResult } from "@/services/constitutional-replay-stability/replayStateTypes";
import type { EscalationDeterminismResult } from "@/services/escalation-determinism/escalationStateTypes";
import type { HumanSupremacyEnforcementResult } from "@/services/human-supremacy-enforcement/supremacyStateTypes";
import type { RuntimeAdmissibilityResult } from "@/services/runtime-admissibility/runtimeAdmissibilityStateTypes";

export type ConstitutionalTelemetryState =
  | "stable"
  | "elevated"
  | "frozen"
  | "disputed"
  | "invalid"
  | "revoked";

export type TelemetrySeverity = "none" | "moderate" | "high" | "critical";

export type ConstitutionalTelemetryErrorCode =
  | "CONSTITUTIONAL_TELEMETRY_REPLAY_MISMATCH"
  | "CONSTITUTIONAL_TELEMETRY_GOVERNANCE_DETACHED"
  | "CONSTITUTIONAL_TELEMETRY_CONTAINMENT_DRIFT"
  | "CONSTITUTIONAL_TELEMETRY_ESCALATION_VOLATILITY"
  | "CONSTITUTIONAL_TELEMETRY_OVERRIDE_PROPAGATION_FAILURE"
  | "CONSTITUTIONAL_TELEMETRY_AUTHORITY_PRESSURE"
  | "CONSTITUTIONAL_TELEMETRY_COORDINATION_DRIFT"
  | "CONSTITUTIONAL_TELEMETRY_RECOMMENDATION_ANOMALY"
  | "CONSTITUTIONAL_TELEMETRY_TOPOLOGY_MUTATION"
  | "CONSTITUTIONAL_TELEMETRY_HIDDEN_ORCHESTRATION"
  | "CONSTITUTIONAL_TELEMETRY_RECURSIVE_COORDINATION"
  | "CONSTITUTIONAL_TELEMETRY_AUTHORITY_CROSSOVER"
  | "CONSTITUTIONAL_TELEMETRY_ISOLATION_VIOLATION"
  | "CONSTITUTIONAL_TELEMETRY_BOUNDARY_VIOLATION"
  | "CONSTITUTIONAL_TELEMETRY_VALIDATOR_MISMATCH";

export type ConstitutionalTelemetryError = Readonly<{
  code: ConstitutionalTelemetryErrorCode;
  message: string;
  path: string;
}>;

export type TelemetryDomain =
  | "governance_violation"
  | "replay_instability"
  | "escalation_volatility"
  | "override_propagation"
  | "authority_pressure"
  | "coordination_drift"
  | "containment_pressure"
  | "recommendation_anomaly";

export type TelemetryEvent = Readonly<{
  telemetryId: string;
  domain: TelemetryDomain;
  triggered: boolean;
  severity: TelemetrySeverity;
  reason: string;
  deterministicHash: string;
}>;

export type TelemetryCorrelationRecord = Readonly<{
  correlationId: string;
  telemetryId: string;
  eventHashes: readonly string[];
  correlatedDomains: readonly TelemetryDomain[];
  correlationHash: string;
}>;

export type ConstitutionalTimelineRecord = Readonly<{
  timelineId: string;
  telemetryId: string;
  governanceLineageHash: string;
  replayLineageHash: string;
  escalationLineageHash: string;
  overrideLineageHash: string;
  containmentLineageHash: string;
  timelineHash: string;
}>;

export type ForensicReplayBinding = Readonly<{
  bindingId: string;
  replayBound: boolean;
  governanceBound: boolean;
  escalationBound: boolean;
  overrideBound: boolean;
  containmentBound: boolean;
  runtimeBound: boolean;
  deterministicHash: string;
}>;

export type ConstitutionalTelemetryInput = Readonly<{
  telemetryId: string;
  constitutionalReplayResult: ConstitutionalReplayStabilityResult;
  humanSupremacyResult: HumanSupremacyEnforcementResult;
  escalationDeterminismResult: EscalationDeterminismResult;
  antiEmergenceResult: AntiEmergenceResult;
  runtimeAdmissibilityResult: RuntimeAdmissibilityResult;
  deterministicSeed: string;
  validatorVersionId: string;
  createdAt: string;
  existingLineage?: TelemetryLineageLedger;
  existingReplayLedger?: readonly TelemetryLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type ConstitutionalTelemetryEvidence = Readonly<{
  evidenceId: string;
  telemetryId: string;
  replayEvidenceId: string;
  runtimeEvidenceId: string;
  supremacyEvidenceId: string;
  escalationEvidenceId: string;
  emergenceEvidenceId: string;
  evidenceRefs: readonly string[];
  reasons: readonly string[];
  evidenceHash: string;
}>;

export type TelemetryLineageEntry = Readonly<{
  entryId: string;
  telemetryId: string;
  coordinationId: string;
  telemetryState: ConstitutionalTelemetryState;
  createdAt: string;
  deterministicHash: string;
}>;

export type TelemetryLineageLedger = Readonly<{
  entries: readonly TelemetryLineageEntry[];
  lineageHash: string;
}>;

export type TelemetryLedgerEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type TelemetryForensicExport = Readonly<{
  exportId: string;
  telemetryId: string;
  evidenceHash: string;
  lineageHash: string;
  correlationHash: string;
  timelineHash: string;
  exportHash: string;
}>;

export type TelemetryIntegrityReport = Readonly<{
  reportId: string;
  telemetryId: string;
  telemetryState: ConstitutionalTelemetryState;
  failClosed: boolean;
  deterministic: boolean;
  reasons: readonly string[];
  reportHash: string;
}>;

export type ConstitutionalTelemetryRecord = Readonly<{
  telemetryId: string;
  coordinationId: string;
  replayId: string;
  supremacyId: string;
  escalationId: string;
  containmentId: string;
  admissibilityId: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  telemetryState: ConstitutionalTelemetryState;
  replaySafe: boolean;
  failClosed: boolean;
  createdAt: string;
}>;

export type ConstitutionalTelemetryResult = Readonly<{
  record: ConstitutionalTelemetryRecord;
  replayBinding: ForensicReplayBinding;
  events: readonly TelemetryEvent[];
  correlation: TelemetryCorrelationRecord;
  timeline: ConstitutionalTimelineRecord;
  evidence: ConstitutionalTelemetryEvidence;
  lineage: TelemetryLineageLedger;
  replayLedger: readonly TelemetryLedgerEntry[];
  forensicExport: TelemetryForensicExport;
  integrityReport: TelemetryIntegrityReport;
  warnings: readonly string[];
  errors: readonly ConstitutionalTelemetryError[];
  deterministicHash: string;
  derivedOnly: true;
}>;
