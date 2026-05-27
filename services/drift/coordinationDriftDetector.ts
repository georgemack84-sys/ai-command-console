import type { CoordinationDriftReport, DriftRecord, FreshnessError, ProposalConfidenceState, ReplayIntegrityState, GovernanceCompatibilityState } from "@/types/freshness";
import { analyzeTelemetryDrift } from "./telemetryDriftAnalyzer";
import { monitorGovernanceDrift } from "./governanceDriftMonitor";
import { evaluateEnvironmentDrift } from "./environmentDriftEvaluator";
import { detectReplayMismatch } from "./replayMismatchDetector";
import { analyzePolicyDrift } from "./policyDriftAnalyzer";
import { inspectDriftDeterminism } from "./driftDeterminismInspector";
import { hashFreshnessValue } from "@/services/freshness/freshnessHasher";

export function detectCoordinationDrift(input: {
  proposalId: string;
  confidenceScore: number;
  proposalGovernanceHash: string;
  lifecycleGovernanceHash: string;
  replayValid: boolean;
  lifecycleReplayHash: string;
  proposalReplayHash: string;
  readinessPolicyView: readonly string[];
  expectedEnvironmentHash: string;
  observedEnvironmentHash?: string;
  createdAt: string;
}): Readonly<{
  report: CoordinationDriftReport;
  confidenceState: ProposalConfidenceState;
  replayIntegrity: ReplayIntegrityState;
  governanceCompatibility: GovernanceCompatibilityState;
  errors: readonly FreshnessError[];
}> {
  const telemetry = analyzeTelemetryDrift({
    proposalId: input.proposalId,
    confidenceScore: input.confidenceScore,
    createdAt: input.createdAt,
  });
  const governance = monitorGovernanceDrift({
    proposalId: input.proposalId,
    proposalGovernanceHash: input.proposalGovernanceHash,
    lifecycleGovernanceHash: input.lifecycleGovernanceHash,
    createdAt: input.createdAt,
  });
  const replay = detectReplayMismatch({
    proposalId: input.proposalId,
    replayValid: input.replayValid,
    lifecycleReplayHash: input.lifecycleReplayHash,
    proposalReplayHash: input.proposalReplayHash,
    createdAt: input.createdAt,
  });
  const environment = evaluateEnvironmentDrift({
    proposalId: input.proposalId,
    expectedEnvironmentHash: input.expectedEnvironmentHash,
    observedEnvironmentHash: input.observedEnvironmentHash,
    createdAt: input.createdAt,
  });
  const policy = analyzePolicyDrift({
    proposalId: input.proposalId,
    readinessPolicyView: input.readinessPolicyView,
    createdAt: input.createdAt,
  });

  const drifts: readonly DriftRecord[] = Object.freeze([
    ...telemetry.drifts,
    ...governance.drifts,
    ...replay.drifts,
    ...environment,
    ...policy,
  ].sort((a, b) => a.driftId.localeCompare(b.driftId)));

  const report: CoordinationDriftReport = Object.freeze({
    proposalId: input.proposalId,
    drifts,
    deterministic: true,
    reportHash: hashFreshnessValue("coordination-drift-report", {
      proposalId: input.proposalId,
      drifts,
      createdAt: input.createdAt,
    }),
    createdAt: input.createdAt,
  });

  return Object.freeze({
    report,
    confidenceState: telemetry.confidenceState,
    replayIntegrity: replay.replayIntegrity,
    governanceCompatibility: governance.compatibility,
    errors: inspectDriftDeterminism(report),
  });
}
