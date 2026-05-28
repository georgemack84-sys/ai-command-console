import type {
  ConstitutionalReplayStabilityInput,
  ConstitutionalReplayStabilityResult,
  ReplayStabilityLineageEntry,
} from "./replayStateTypes";
import { validateReplayStabilityInput } from "./replaySchemas";
import { loadHistoricalGovernanceSnapshot } from "./governanceSnapshotLoader";
import { loadReplayVersion } from "./replayVersionLoader";
import { validateReplayBinding } from "./replayBindingValidator";
import { validateReplayState } from "./replayStateValidator";
import { validateReplaySnapshot } from "./replaySnapshotValidator";
import { reconstructReplayConfidenceEvolution } from "./replayConfidenceEvolutionEngine";
import { reconstructReplayEscalation } from "./replayEscalationReconstructor";
import { reconstructReplayOverridePropagation } from "./replayOverridePropagationEngine";
import { validateReplayGovernance } from "./replayGovernanceValidator";
import { validateReplayTopology } from "./replayTopologyValidator";
import { detectReplayCorruption } from "./replayCorruptionDetector";
import { detectReplayDrift } from "./replayDriftDetector";
import { compareReplayLineage } from "./replayLineageComparator";
import {
  appendReplayStabilityLineage,
  appendReplayStabilityLedger,
} from "./replayLineageAuditor";
import { appendReplayAuditLedger } from "./replayAuditLedger";
import { bundleReplayEvidence } from "./replayEvidenceBundler";
import { exportReplayForensics } from "./replayForensicExporter";
import { validateReplayDeterminism } from "./replayDeterminismValidator";
import { validateReplayConsistency } from "./replayConsistencyEngine";
import { validateReplayContainment } from "./replayContainmentValidator";
import { validateReplayIsolation } from "./replayIsolationLayer";
import { enforceReplayBoundary } from "./replayBoundaryEnforcer";
import { resolveReplayFailureState } from "./replayFailureCoordinator";
import { buildReplayIntegrityReport } from "./replayIntegrityReporter";
import { hashReplayStabilityValue } from "./replayHashingEngine";

export function buildConstitutionalReplayStability(
  input: ConstitutionalReplayStabilityInput,
): ConstitutionalReplayStabilityResult {
  const schemaErrors = validateReplayStabilityInput(input);
  const versionErrors = loadReplayVersion(input);
  const governance = loadHistoricalGovernanceSnapshot(input);
  const governanceErrors = validateReplayGovernance(governance.snapshot);
  const snapshotErrors = validateReplaySnapshot({ replayInput: input, snapshot: governance.snapshot });
  const binding = validateReplayBinding({ replayInput: input, snapshot: governance.snapshot });
  const replayState = validateReplayState({ replayInput: input, snapshot: governance.snapshot });
  const confidence = reconstructReplayConfidenceEvolution(input);
  const escalation = reconstructReplayEscalation(input);
  const override = reconstructReplayOverridePropagation(input);
  const topologyErrors = validateReplayTopology(input);
  const corruptionErrors = detectReplayCorruption(input);
  const driftErrors = detectReplayDrift({
    binding: binding.binding,
    state: replayState.state,
    confidence: confidence.confidence,
    escalation: escalation.escalation,
    override: override.override,
  });
  const lineageComparisonErrors = compareReplayLineage({
    binding: binding.binding,
    existingLineage: input.existingLineage,
  });
  const determinismErrors = validateReplayDeterminism({
    replayId: input.replayId,
    binding: binding.binding,
    state: replayState.state,
    confidence: confidence.confidence,
    escalation: escalation.escalation,
    override: override.override,
  });
  const consistencyErrors = validateReplayConsistency({
    state: replayState.state,
  });
  const containmentErrors = validateReplayContainment(input);
  const isolationErrors = validateReplayIsolation(input);
  const boundaryErrors = enforceReplayBoundary(input);

  const errors = Object.freeze([
    ...schemaErrors,
    ...versionErrors,
    ...governance.errors,
    ...governanceErrors,
    ...snapshotErrors,
    ...binding.errors,
    ...replayState.errors,
    ...confidence.errors,
    ...escalation.errors,
    ...override.errors,
    ...topologyErrors,
    ...corruptionErrors,
    ...driftErrors,
    ...lineageComparisonErrors,
    ...determinismErrors,
    ...consistencyErrors,
    ...containmentErrors,
    ...isolationErrors,
    ...boundaryErrors,
  ]);

  const classification = resolveReplayFailureState(errors);
  const evidence = bundleReplayEvidence({
    replayInput: input,
    reasons: Object.freeze(errors.map((item) => item.code)),
  });

  const lineageEntry: ReplayStabilityLineageEntry = Object.freeze({
    entryId: hashReplayStabilityValue("constitutional-replay-stability-lineage-entry-id", {
      replayId: input.replayId,
      createdAt: input.createdAt,
    }),
    replayId: input.replayId,
    coordinationId: input.constitutionalAuthorityBoundaryResult.record.coordinationId,
    classification,
    createdAt: input.createdAt,
    deterministicHash: hashReplayStabilityValue("constitutional-replay-stability-lineage-entry", {
      replayId: input.replayId,
      classification,
      evidenceHash: evidence.evidenceHash,
    }),
  });
  const lineage = appendReplayStabilityLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });

  const forensicExport = exportReplayForensics({
    replayId: input.replayId,
    evidence,
    lineage,
    governanceHash: governance.snapshot.governanceHash,
    escalation: escalation.escalation,
    confidence: confidence.confidence,
    override: override.override,
  });

  const replayLedger = appendReplayStabilityLedger({
    existing: input.existingReplayLedger,
    payload: Object.freeze({
      event: "constitutional.replay.reconstructed",
      replayId: input.replayId,
      classification,
      lineageHash: lineage.lineageHash,
      evidenceHash: evidence.evidenceHash,
    }),
    scope: "constitutional-replay-stability",
  });
  const auditLedger = appendReplayAuditLedger({
    existing: replayLedger,
    payload: Object.freeze({
      event: classification === "STABLE" ? "replay.verified" : "replay.frozen",
      replayId: input.replayId,
      classification,
      exportHash: forensicExport.exportHash,
      lineageHash: lineage.lineageHash,
    }),
    scope: "constitutional-replay-stability-audit",
  });

  const integrityReport = buildReplayIntegrityReport({
    replayId: input.replayId,
    classification,
    errors,
    replayDeterministic: determinismErrors.length === 0,
  });

  const record = Object.freeze({
    replayId: input.replayId,
    coordinationId: input.constitutionalAuthorityBoundaryResult.record.coordinationId,
    boundaryId: input.constitutionalAuthorityBoundaryResult.record.boundaryId,
    governanceSnapshotId: governance.snapshot.governanceSnapshotId,
    replaySnapshotId: governance.snapshot.replaySnapshotId,
    classification,
    replayDeterministic: determinismErrors.length === 0,
    failClosed: classification === "FROZEN" || classification === "INVALID" || classification === "DISPUTED" || classification === "REVOKED",
    createdAt: input.createdAt,
  });

  return Object.freeze({
    record,
    historicalGovernance: governance.snapshot,
    replayBinding: binding.binding,
    replayState: replayState.state,
    confidenceEvolution: confidence.confidence,
    escalationReconstruction: escalation.escalation,
    overridePropagation: override.override,
    evidence,
    forensicExport,
    integrityReport,
    lineage,
    replayLedger: auditLedger,
    warnings: Object.freeze(classification === "DEGRADED"
      ? ["Replay remained reconstructive-only but drift indicators increased oversight."]
      : []),
    errors,
    deterministicHash: hashReplayStabilityValue("constitutional-replay-stability-result", {
      replayId: input.replayId,
      classification,
      evidenceHash: evidence.evidenceHash,
      lineageHash: lineage.lineageHash,
      exportHash: forensicExport.exportHash,
      reportHash: integrityReport.reportHash,
    }),
    derivedOnly: true as const,
  });
}
