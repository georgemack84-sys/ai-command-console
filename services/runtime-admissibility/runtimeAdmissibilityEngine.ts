import type {
  RuntimeAdmissibilityInput,
  RuntimeAdmissibilityResult,
  RuntimeCertificationLineageEntry,
} from "./runtimeAdmissibilityStateTypes";
import { validateRuntimeAdmissibilityInput } from "./runtimeAdmissibilitySchemas";
import { runRuntimeAdmissibilitySimulation } from "./runtimeAdmissibilitySimulationHarness";
import { checkRuntimeGovernanceCompatibility } from "./runtimeGovernanceChecker";
import { validateRuntimeGovernanceBinding } from "./runtimeGovernanceBindingValidator";
import { validateRuntimeReplayCompatibility } from "./runtimeReplayCompatibilityValidator";
import { validateRuntimeCertificationReplay } from "./runtimeCertificationReplayValidator";
import { validateRollbackReadiness } from "./rollbackReadinessValidator";
import { certifyRuntimeObservability } from "./observabilityCertifier";
import { validateRuntimeApprovalCompatibility } from "./runtimeApprovalCompatibilityValidator";
import { validateRuntimeEscalationCompatibility } from "./runtimeEscalationCompatibilityValidator";
import { validateRuntimeOverrideCompatibility } from "./runtimeOverrideCompatibilityValidator";
import { validateRuntimeContainment } from "./runtimeContainmentValidator";
import { validateRuntimeTopology } from "./runtimeTopologyValidator";
import { validateRuntimeAntiEmergence } from "./runtimeAntiEmergenceValidator";
import { validateRuntimeIsolation } from "./runtimeIsolationLayer";
import { enforceRuntimeAdmissibilityBoundary } from "./runtimeAdmissibilityBoundaryEnforcer";
import { scoreRuntimeReadiness } from "./runtimeReadinessScorer";
import { resolveRuntimeAdmissibilityClassification } from "./runtimeAdmissibilityFailureCoordinator";
import { buildRuntimeCompatibilityRecord } from "./runtimeCompatibilityValidator";
import { bundleRuntimeCertificationEvidence } from "./runtimeCertificationEvidenceBundler";
import { appendRuntimeCertificationLedger, appendRuntimeCertificationLineage } from "./runtimeCertificationLineageLog";
import { exportRuntimeCertificationForensics } from "./runtimeCertificationForensicExporter";
import { buildRuntimeCertificationIntegrityReport } from "./runtimeCertificationIntegrityReporter";
import { hashRuntimeCertificationValue } from "./runtimeCertificationHashingEngine";

export function buildRuntimeAdmissibility(
  input: RuntimeAdmissibilityInput,
): RuntimeAdmissibilityResult {
  const schemaErrors = validateRuntimeAdmissibilityInput(input);
  const signals = runRuntimeAdmissibilitySimulation(input);
  const governance = checkRuntimeGovernanceCompatibility(input);
  const governanceBinding = validateRuntimeGovernanceBinding(input);
  const replayErrors = validateRuntimeReplayCompatibility(input);
  const certificationReplayErrors = validateRuntimeCertificationReplay(input);
  const rollbackErrors = validateRollbackReadiness(input);
  const observabilityErrors = certifyRuntimeObservability(input);
  const approvalErrors = validateRuntimeApprovalCompatibility(input);
  const escalationErrors = validateRuntimeEscalationCompatibility(input);
  const overrideErrors = validateRuntimeOverrideCompatibility(input);
  const containmentErrors = validateRuntimeContainment(input);
  const topologyErrors = validateRuntimeTopology(input);
  const antiEmergenceErrors = validateRuntimeAntiEmergence(input);
  const isolationErrors = validateRuntimeIsolation(input);
  const boundaryErrors = enforceRuntimeAdmissibilityBoundary(input);

  const errors = Object.freeze([
    ...schemaErrors,
    ...governance.errors,
    ...governanceBinding.errors,
    ...replayErrors,
    ...certificationReplayErrors,
    ...rollbackErrors,
    ...observabilityErrors,
    ...approvalErrors,
    ...escalationErrors,
    ...overrideErrors,
    ...containmentErrors,
    ...topologyErrors,
    ...antiEmergenceErrors,
    ...isolationErrors,
    ...boundaryErrors,
  ]);

  const compatibility = buildRuntimeCompatibilityRecord({
    governanceCompatible: governance.errors.length === 0,
    replayCompatible: replayErrors.length === 0 && certificationReplayErrors.length === 0,
    rollbackCompatible: rollbackErrors.length === 0,
    observabilityCompatible: observabilityErrors.length === 0,
    approvalCompatible: approvalErrors.length === 0,
    escalationCompatible: escalationErrors.length === 0,
    overrideCompatible: overrideErrors.length === 0,
    containmentCompatible: containmentErrors.length === 0,
    antiEmergenceCompatible: antiEmergenceErrors.length === 0,
    topologyCompatible: topologyErrors.length === 0,
  });
  const readinessScore = scoreRuntimeReadiness({
    admissibilityInput: input,
    signals,
  });
  const classification = resolveRuntimeAdmissibilityClassification(errors, readinessScore);
  const evidence = bundleRuntimeCertificationEvidence({
    admissibilityInput: input,
    reasons: Object.freeze(errors.map((error) => error.code)),
  });
  const lineageEntry: RuntimeCertificationLineageEntry = Object.freeze({
    entryId: hashRuntimeCertificationValue("runtime-admissibility-lineage-entry-id", {
      admissibilityId: input.admissibilityId,
      createdAt: input.createdAt,
    }),
    admissibilityId: input.admissibilityId,
    coordinationId: input.constitutionalReplayResult.record.coordinationId,
    classification,
    score: readinessScore.score,
    createdAt: input.createdAt,
    deterministicHash: hashRuntimeCertificationValue("runtime-admissibility-lineage-entry", {
      admissibilityId: input.admissibilityId,
      classification,
      score: readinessScore.score,
      evidenceHash: evidence.evidenceHash,
    }),
  });
  const lineage = appendRuntimeCertificationLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const primaryLedger = appendRuntimeCertificationLedger({
    existing: input.existingReplayLedger,
    payload: Object.freeze({
      event: "runtime.admissibility.evaluated",
      admissibilityId: input.admissibilityId,
      classification,
      score: readinessScore.score,
      evidenceHash: evidence.evidenceHash,
      lineageHash: lineage.lineageHash,
    }),
    scope: "runtime-admissibility",
  });
  const replayLedger = appendRuntimeCertificationLedger({
    existing: primaryLedger,
    payload: Object.freeze({
      event: classification === "admissible" ? "runtime.admissibility.certified" : "runtime.admissibility.restricted",
      admissibilityId: input.admissibilityId,
      classification,
      compatibilityHash: compatibility.deterministicHash,
      governanceBindingHash: governanceBinding.governanceBinding.deterministicHash,
    }),
    scope: "runtime-admissibility-audit",
  });
  const forensicExport = exportRuntimeCertificationForensics({
    admissibilityId: input.admissibilityId,
    evidence,
    lineage,
    topologyHash: input.runtimeTopology.topologyHash,
    observabilityHash: input.observabilitySnapshot.observabilityHash,
    rollbackHash: input.rollbackSnapshot.rollbackHash,
  });
  const integrityReport = buildRuntimeCertificationIntegrityReport({
    admissibilityId: input.admissibilityId,
    classification,
    errors,
    deterministic: errors.every((error) => error.code !== "RUNTIME_ADMISSIBILITY_VALIDATOR_MISMATCH"),
  });

  const record = Object.freeze({
    admissibilityId: input.admissibilityId,
    coordinationId: input.constitutionalReplayResult.record.coordinationId,
    replayId: input.constitutionalReplayResult.record.replayId,
    supremacyId: input.humanSupremacyResult.record.supremacyId,
    escalationId: input.escalationDeterminismResult.record.escalationId,
    containmentId: input.antiEmergenceResult.record.containmentId,
    governanceSnapshotId: input.constitutionalReplayResult.record.governanceSnapshotId,
    replaySnapshotId: input.constitutionalReplayResult.record.replaySnapshotId,
    runtimeId: input.runtimeTopology.runtimeId,
    classification,
    failClosed: classification !== "admissible",
    replaySafe: input.constitutionalReplayResult.record.replayDeterministic,
    governanceBound: governanceBinding.governanceBinding.governanceBound,
    createdAt: input.createdAt,
  });

  return Object.freeze({
    record,
    governanceCheck: governance.governanceCheck,
    governanceBinding: governanceBinding.governanceBinding,
    compatibility,
    readinessScore,
    simulationSignals: signals,
    evidence,
    lineage,
    replayLedger,
    forensicExport,
    integrityReport,
    warnings: Object.freeze(classification === "admissible"
      ? ["Runtime admissibility remained observational, replay-safe, and constitutionally bounded."]
      : ["Runtime admissibility tightened restriction and increased oversight under uncertainty."]),
    errors,
    deterministicHash: hashRuntimeCertificationValue("runtime-admissibility-result", {
      admissibilityId: input.admissibilityId,
      classification,
      evidenceHash: evidence.evidenceHash,
      lineageHash: lineage.lineageHash,
      exportHash: forensicExport.exportHash,
      reportHash: integrityReport.reportHash,
      scoreHash: readinessScore.scoreHash,
    }),
    derivedOnly: true as const,
  });
}
