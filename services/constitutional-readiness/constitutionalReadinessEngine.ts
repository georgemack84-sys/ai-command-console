import type {
  ConstitutionalReadinessInput,
  ConstitutionalReadinessResult,
  ReadinessDomainScore,
  ReadinessLineageEntry,
} from "@/types/constitutional-readiness";
import { buildReadinessAuthorityContract } from "./readinessContracts";
import { validateReplayReadiness } from "./replayReadinessValidator";
import { validateGovernanceReadiness } from "./governanceReadinessValidator";
import { validateApprovalReadiness } from "./approvalReadinessValidator";
import { validateEscalationStability } from "./escalationStabilityValidator";
import { validateRecommendationIntegrity } from "./recommendationIntegrityValidator";
import { validateDriftResistance } from "./driftResistanceValidator";
import { validateContainmentGuarantees } from "./containmentGuaranteeValidator";
import { buildConstitutionalRiskProfile } from "./constitutionalRiskEngine";
import { certifyReadinessState } from "./readinessCertificationEngine";
import { freezeReadinessState } from "./readinessFreezeCoordinator";
import { resolveReadinessFailClosedState } from "./readinessFailClosedCoordinator";
import { bindReadinessGovernance } from "./readinessGovernanceBinder";
import { verifyReadinessReplay } from "./readinessReplayVerifier";
import { buildReadinessEvidence } from "./readinessEvidenceBuilder";
import { appendReadinessLineage, buildReadinessLineageGraph } from "./readinessLineageEngine";
import { validateReadinessBoundary } from "./readinessBoundaryValidator";
import { validateReadinessIsolation } from "./readinessIsolationValidator";
import { validateReadinessContainment } from "./readinessContainmentValidator";
import { appendReadinessAuditLedger } from "./readinessAuditLedger";
import { hashReadinessValue } from "./readinessHashEngine";

function toDomainScore(domain: string, score: number): ReadinessDomainScore {
  return Object.freeze({
    domain,
    score: Number(score.toFixed(4)),
  });
}

export function buildConstitutionalReadiness(
  input: ConstitutionalReadinessInput,
): ConstitutionalReadinessResult {
  const authorityContract = buildReadinessAuthorityContract();
  const replay = validateReplayReadiness(input);
  const governance = validateGovernanceReadiness(input);
  const approval = validateApprovalReadiness(input);
  const escalation = validateEscalationStability(input);
  const recommendation = validateRecommendationIntegrity(input);
  const drift = validateDriftResistance(input);
  const containment = validateContainmentGuarantees(input);
  const boundaryErrors = validateReadinessBoundary(input);
  const isolationErrors = validateReadinessIsolation(input);
  const containmentErrors = validateReadinessContainment(input);

  const errors = Object.freeze([
    ...replay.errors,
    ...governance.errors,
    ...approval.errors,
    ...escalation.errors,
    ...recommendation.errors,
    ...drift.errors,
    ...containment.errors,
    ...boundaryErrors,
    ...isolationErrors,
    ...containmentErrors,
  ]);

  const domainScores = Object.freeze([
    toDomainScore("replay", replay.record.replayScore),
    toDomainScore("governance", 1 - governance.record.governanceViolationRate),
    toDomainScore("approval", 1 - approval.record.approvalInstabilityScore),
    toDomainScore("escalation", 1 - escalation.record.escalationFailureRate),
    toDomainScore("recommendation", 1 - Math.max(
      recommendation.record.recommendationAnomalyRate,
      recommendation.record.confidenceVolatilityScore,
    )),
    toDomainScore("drift", 1 - drift.record.driftPressureScore),
    toDomainScore("containment", 1 - containment.record.containmentPressureScore),
  ]);

  const governanceBinding = bindReadinessGovernance(input);
  const replayVerification = verifyReadinessReplay({
    readinessInput: input,
    replayStable: replay.record.replaySafe,
  });
  const risk = buildConstitutionalRiskProfile({
    readinessId: input.readinessId,
    scores: domainScores,
    errors,
  });

  const baseClassification = certifyReadinessState({
    errors,
    inheritedFailClosed: input.adversarialTelemetryResult.record.failClosed,
    replaySafe: replayVerification.replayDeterministic,
    governanceBound: governanceBinding.governanceBound,
    risk,
  });
  const failClosedClassification = resolveReadinessFailClosedState({
    classification: baseClassification,
    containmentFreezeRecommended: containment.record.freezeRecommended,
    inheritedFailClosed: input.adversarialTelemetryResult.record.failClosed,
    errors,
  });
  const readinessClassification = freezeReadinessState({
    classification: failClosedClassification,
    inheritedFailClosed: input.adversarialTelemetryResult.record.failClosed,
  });

  const evidence = buildReadinessEvidence({
    readinessInput: input,
    evidenceRefs: Object.freeze([
      input.adversarialTelemetryResult.evidence.evidenceId,
      ...input.adversarialTelemetryResult.events.map((event) => event.telemetryId),
    ]),
    reasons: Object.freeze(errors.map((item) => item.code)),
  });

  const lineageEntry: ReadinessLineageEntry = Object.freeze({
    entryId: hashReadinessValue("constitutional-readiness-lineage-entry-id", {
      readinessId: input.readinessId,
      createdAt: input.createdAt,
    }),
    readinessId: input.readinessId,
    coordinationId: input.adversarialTelemetryResult.record.coordinationId,
    readinessClassification,
    riskLevel: risk.riskLevel,
    createdAt: input.createdAt,
    deterministicHash: hashReadinessValue("constitutional-readiness-lineage-entry", {
      readinessClassification,
      evidenceHash: evidence.evidenceHash,
      riskLevel: risk.riskLevel,
    }),
  });
  const lineage = appendReadinessLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const lineageGraph = buildReadinessLineageGraph(lineage);
  const replayLedger = appendReadinessAuditLedger({
    existing: input.existingReplayLedger,
    payload: Object.freeze({
      event: "readiness.scored",
      readinessId: input.readinessId,
      readinessClassification,
      lineageHash: lineage.lineageHash,
      evidenceHash: evidence.evidenceHash,
    }),
    scope: "constitutional-readiness",
  });
  const auditLedger = appendReadinessAuditLedger({
    existing: replayLedger,
    payload: Object.freeze({
      event: readinessClassification === "VERIFIED" ? "readiness.verified" : "readiness.frozen",
      readinessId: input.readinessId,
      readinessClassification,
      replayHash: replayVerification.replayHash,
      lineageHash: lineage.lineageHash,
    }),
    scope: "constitutional-readiness-audit",
  });

  const record = Object.freeze({
    readinessId: input.readinessId,
    coordinationId: input.adversarialTelemetryResult.record.coordinationId,
    telemetryId: input.adversarialTelemetryResult.record.telemetryId,
    episodeId: input.adversarialTelemetryResult.record.episodeId,
    governanceSnapshotId: input.adversarialTelemetryResult.record.governanceSnapshotId,
    replaySnapshotId: input.adversarialTelemetryResult.record.replaySnapshotId,
    readinessClassification,
    replaySafe: replayVerification.replayDeterministic,
    failClosed: readinessClassification === "FROZEN" || readinessClassification === "INVALID" || readinessClassification === "DISPUTED",
    createdAt: input.createdAt,
  });

  return Object.freeze({
    record,
    authorityContract,
    replayReadiness: replay.record,
    governanceReadiness: governance.record,
    approvalReadiness: approval.record,
    escalationReadiness: escalation.record,
    recommendationReadiness: recommendation.record,
    driftResistance: drift.record,
    containmentReadiness: containment.record,
    governanceBinding,
    replayVerification,
    evidence,
    lineage,
    lineageGraph,
    replayLedger: auditLedger,
    risk,
    warnings: Object.freeze(readinessClassification === "CONDITIONAL"
      ? ["Readiness remained advisory-only but retained constitutionally significant pressure."]
      : []),
    errors,
    deterministicHash: hashReadinessValue("constitutional-readiness-final-result", {
      readinessId: input.readinessId,
      readinessClassification,
      lineageHash: lineage.lineageHash,
      evidenceHash: evidence.evidenceHash,
      replayHash: replayVerification.replayHash,
      riskHash: risk.deterministicHash,
    }),
    derivedOnly: true as const,
  });
}

export const scoreConstitutionalReadiness = buildConstitutionalReadiness;
