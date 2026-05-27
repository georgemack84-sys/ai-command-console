import type {
  ConstitutionalReadinessInput,
  ConstitutionalReadinessResult,
  ReadinessClassification,
  ReadinessDomainScore,
  ReadinessLineageEntry,
} from "./readinessStateTypes";
import { validateReadinessInput } from "./readinessSchemas";
import { scoreGovernanceIntegrity } from "./governanceIntegrityScorer";
import { certifyReplayReadiness } from "./replayCertificationEngine";
import { certifyContainment } from "./containmentCertifier";
import { scoreRuntimeCompatibility } from "./runtimeCompatibilityScorer";
import { scoreEscalationCorrectness } from "./escalationCorrectnessScorer";
import { scoreOverrideReliability } from "./overrideReliabilityScorer";
import { certifyHumanSupremacy } from "./humanSupremacyCertifier";
import { scoreDriftResistance } from "./driftResistanceScorer";
import { computeReadinessConfidence } from "./constitutionalConfidenceEngine";
import { computeUncertaintyPenalty } from "./uncertaintyPenaltyEngine";
import { classifyReadiness } from "./readinessClassificationEngine";
import { createReadinessEvidence } from "./readinessEvidenceGenerator";
import { appendReadinessLedger, appendReadinessLineage } from "./immutableReadinessLineageLog";
import { validateReadinessGovernanceBinding } from "./readinessGovernanceBindingValidator";
import { validateReadinessReplayBinding } from "./readinessReplayBindingValidator";
import { validateReadinessContainment } from "./readinessContainmentValidator";
import { validateReadinessDeterminism } from "./readinessDeterminismValidator";
import { enforceReadinessIsolationBoundary } from "./readinessIsolationBoundary";
import { enforceReadinessAuthorityFirewall } from "./readinessAuthorityFirewall";
import { hashReadinessValue } from "./readinessTraceHasher";

function toDomainScore(input: {
  domain: ReadinessDomainScore["domain"];
  requirement: string;
  score: number;
  certified: boolean;
}): ReadinessDomainScore {
  return Object.freeze({
    domain: input.domain,
    requirement: input.requirement,
    score: Number(input.score.toFixed(4)),
    certified: input.certified,
    deterministicHash: hashReadinessValue("constitutional-readiness-domain-score", input),
  });
}

function createExport(input: {
  readinessId: string;
  evidenceHash: string;
  lineageHash: string;
  reportHash: string;
  scoreHash: string;
}) {
  return Object.freeze({
    exportId: hashReadinessValue("constitutional-readiness-export-id", {
      readinessId: input.readinessId,
    }),
    readinessId: input.readinessId,
    evidenceHash: input.evidenceHash,
    lineageHash: input.lineageHash,
    reportHash: input.reportHash,
    scoreHash: input.scoreHash,
    exportHash: hashReadinessValue("constitutional-readiness-export", input),
  });
}

export function buildConstitutionalReadinessScoring(
  input: ConstitutionalReadinessInput,
): ConstitutionalReadinessResult {
  const schemaErrors = validateReadinessInput(input);
  const governanceIntegrity = scoreGovernanceIntegrity(input);
  const replayCertification = certifyReplayReadiness(input);
  const containmentCertification = certifyContainment(input);
  const runtimeCompatibility = scoreRuntimeCompatibility(input);
  const escalationCorrectness = scoreEscalationCorrectness(input);
  const overrideReliability = scoreOverrideReliability(input);
  const humanSupremacyCertification = certifyHumanSupremacy(input);
  const driftResistance = scoreDriftResistance(input);
  const governanceBinding = validateReadinessGovernanceBinding(input);
  const replayBinding = validateReadinessReplayBinding(input);
  const containmentErrors = validateReadinessContainment(input);
  const isolationErrors = enforceReadinessIsolationBoundary(input);
  const authorityErrors = enforceReadinessAuthorityFirewall(input);

  const domainScores = Object.freeze([
    toDomainScore({
      domain: "governance_integrity",
      requirement: "Stable",
      score: governanceIntegrity.record.score,
      certified: governanceIntegrity.record.governanceBound && !governanceIntegrity.record.staleGovernanceDetected,
    }),
    toDomainScore({
      domain: "replay_stability",
      requirement: "Deterministic",
      score: replayCertification.record.score,
      certified: replayCertification.record.replayDeterministic,
    }),
    toDomainScore({
      domain: "override_reliability",
      requirement: "Verified",
      score: overrideReliability.record.score,
      certified: overrideReliability.record.globallyPropagated,
    }),
    toDomainScore({
      domain: "escalation_correctness",
      requirement: "Deterministic",
      score: escalationCorrectness.record.score,
      certified: escalationCorrectness.record.deterministic,
    }),
    toDomainScore({
      domain: "containment_stability",
      requirement: "Proven",
      score: containmentCertification.record.score,
      certified: containmentCertification.record.contained,
    }),
    toDomainScore({
      domain: "runtime_compatibility",
      requirement: "Verified",
      score: runtimeCompatibility.record.score,
      certified: runtimeCompatibility.record.runtimeCompatible,
    }),
    toDomainScore({
      domain: "drift_resistance",
      requirement: "Stable",
      score: driftResistance.record.score,
      certified: driftResistance.record.driftResistant,
    }),
    toDomainScore({
      domain: "human_supremacy",
      requirement: "Guaranteed",
      score: humanSupremacyCertification.record.score,
      certified: humanSupremacyCertification.record.supremacyPreserved,
    }),
  ]);

  const determinismErrors = validateReadinessDeterminism({
    readinessInput: input,
    domainScores,
  });

  const errors = Object.freeze([
    ...schemaErrors,
    ...governanceIntegrity.errors,
    ...replayCertification.errors,
    ...containmentCertification.errors,
    ...runtimeCompatibility.errors,
    ...escalationCorrectness.errors,
    ...overrideReliability.errors,
    ...humanSupremacyCertification.errors,
    ...driftResistance.errors,
    ...governanceBinding.errors,
    ...replayBinding.errors,
    ...containmentErrors,
    ...isolationErrors,
    ...authorityErrors,
    ...determinismErrors,
  ]);

  const confidence = computeReadinessConfidence({
    readinessInput: input,
    domainScores,
  });
  const uncertaintyPenalty = computeUncertaintyPenalty({
    readinessInput: input,
    errors,
  });
  const readinessClassification: ReadinessClassification = classifyReadiness({
    confidenceScore: confidence.confidenceScore,
    uncertaintyPenalty: uncertaintyPenalty.penalty,
    errors,
  });
  const evidence = createReadinessEvidence({
    readinessInput: input,
    reasons: Object.freeze(errors.map((error) => error.code)),
  });

  const readinessScore = Number(Math.max(0, confidence.confidenceScore - uncertaintyPenalty.penalty).toFixed(4));
  const failClosed =
    readinessClassification === "FROZEN"
    || readinessClassification === "DISPUTED"
    || readinessClassification === "INVALID";
  const report = Object.freeze({
    readinessId: input.readinessId,
    advisoryOnly: true as const,
    executable: false as const,
    runtimeMutationAllowed: false as const,
    authorityMutationAllowed: false as const,
    governanceMutationAllowed: false as const,
    orchestrationAllowed: false as const,
    operatorReviewRequired: true as const,
    readinessClassification,
    readinessScore,
    confidenceScore: confidence.confidenceScore,
    uncertaintyPenalty: uncertaintyPenalty.penalty,
    failClosed,
    constitutionalViolations: Object.freeze(errors.map((error) => error.code)),
    reportHash: hashReadinessValue("constitutional-readiness-report", {
      readinessId: input.readinessId,
      readinessClassification,
      readinessScore,
      confidenceScore: confidence.confidenceScore,
      uncertaintyPenalty: uncertaintyPenalty.penalty,
      constitutionalViolations: errors.map((error) => error.code),
    }),
  });

  const lineageEntry: ReadinessLineageEntry = Object.freeze({
    entryId: hashReadinessValue("constitutional-readiness-lineage-entry-id", {
      readinessId: input.readinessId,
      createdAt: input.createdAt,
    }),
    readinessId: input.readinessId,
    coordinationId: input.constitutionalReplayResult.record.coordinationId,
    readinessClassification,
    readinessScore,
    createdAt: input.createdAt,
    deterministicHash: hashReadinessValue("constitutional-readiness-lineage-entry", {
      readinessId: input.readinessId,
      readinessClassification,
      readinessScore,
      evidenceHash: evidence.evidenceHash,
    }),
  });
  const lineage = appendReadinessLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const primaryLedger = appendReadinessLedger({
    existing: input.existingReplayLedger,
    payload: Object.freeze({
      event: "constitutional.readiness.scored",
      readinessId: input.readinessId,
      readinessClassification,
      readinessScore,
      evidenceHash: evidence.evidenceHash,
      lineageHash: lineage.lineageHash,
    }),
    scope: "constitutional-readiness-scoring",
  });
  const replayLedger = appendReadinessLedger({
    existing: primaryLedger,
    payload: Object.freeze({
      event: failClosed ? "constitutional.readiness.failed_closed" : "constitutional.readiness.certified",
      readinessId: input.readinessId,
      readinessClassification,
      reportHash: report.reportHash,
      replayBindingHash: replayBinding.replayBinding.deterministicHash,
    }),
    scope: "constitutional-readiness-scoring-audit",
  });
  const exportArtifact = createExport({
    readinessId: input.readinessId,
    evidenceHash: evidence.evidenceHash,
    lineageHash: lineage.lineageHash,
    reportHash: report.reportHash,
    scoreHash: confidence.confidenceHash,
  });

  const record = Object.freeze({
    readinessId: input.readinessId,
    coordinationId: input.constitutionalReplayResult.record.coordinationId,
    replayId: input.constitutionalReplayResult.record.replayId,
    supremacyId: input.humanSupremacyResult.record.supremacyId,
    escalationId: input.escalationDeterminismResult.record.escalationId,
    containmentId: input.antiEmergenceResult.record.containmentId,
    admissibilityId: input.runtimeAdmissibilityResult.record.admissibilityId,
    telemetryId: input.constitutionalTelemetryResult.record.telemetryId,
    simulationId: input.constitutionalRuntimeSimulationResult.report.simulationId,
    governanceSnapshotId: input.constitutionalReplayResult.record.governanceSnapshotId,
    replaySnapshotId: input.constitutionalReplayResult.record.replaySnapshotId,
    readinessClassification,
    failClosed,
    replaySafe: input.constitutionalReplayResult.record.replayDeterministic,
    governanceBound: governanceBinding.governanceBinding.governanceBound,
    createdAt: input.createdAt,
  });

  return Object.freeze({
    record,
    governanceIntegrity: governanceIntegrity.record,
    replayCertification: replayCertification.record,
    containmentCertification: containmentCertification.record,
    runtimeCompatibility: runtimeCompatibility.record,
    escalationCorrectness: escalationCorrectness.record,
    overrideReliability: overrideReliability.record,
    humanSupremacyCertification: humanSupremacyCertification.record,
    driftResistance: driftResistance.record,
    confidence,
    uncertaintyPenalty,
    domainScores,
    replayBinding: replayBinding.replayBinding,
    governanceBinding: governanceBinding.governanceBinding,
    evidence,
    report,
    lineage,
    replayLedger,
    export: exportArtifact,
    warnings: Object.freeze(failClosed
      ? ["Readiness failed closed and increased oversight under uncertainty."]
      : ["Readiness remained advisory-only and never granted authority."]),
    errors,
    deterministicHash: hashReadinessValue("constitutional-readiness-result", {
      readinessId: input.readinessId,
      readinessClassification,
      evidenceHash: evidence.evidenceHash,
      lineageHash: lineage.lineageHash,
      reportHash: report.reportHash,
      exportHash: exportArtifact.exportHash,
      confidenceHash: confidence.confidenceHash,
      uncertaintyPenaltyHash: uncertaintyPenalty.penaltyHash,
    }),
    derivedOnly: true as const,
  });
}

export const scoreConstitutionalReadiness = buildConstitutionalReadinessScoring;
