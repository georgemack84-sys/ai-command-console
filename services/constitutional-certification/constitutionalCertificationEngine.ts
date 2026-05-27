import type {
  CertificationLineageEntry,
  CertificationScorecard,
  ConstitutionalCertificationInput,
  ConstitutionalCertificationResult,
} from "./certificationStateTypes";
import { validateConstitutionalCertificationInput } from "./constitutionalCertificationSchemas";
import { certifyGovernanceImmutability } from "./governanceImmutabilityCertifier";
import { validateGovernanceSupremacy } from "./governanceSupremacyValidator";
import { detectGovernanceBypass } from "./governanceBypassDetector";
import { certifyPolicyLineage } from "./policyLineageCertifier";
import { certifyDeterministicReplay } from "./deterministicReplayCertifier";
import { validateReplayIntegrity } from "./replayIntegrityValidator";
import { verifyReplayLineage } from "./replayLineageVerifier";
import { validateReplayHistoricalTruth } from "./replayHistoricalTruthValidator";
import { certifyHumanSupremacyForCertification } from "./humanSupremacyCertificationEngine";
import { certifyOverridePropagation } from "./overridePropagationCertifier";
import { validateOperatorAuthority } from "./operatorAuthorityValidator";
import { validateConstitutionalKillSwitch } from "./constitutionalKillSwitchValidator";
import { certifyEscalationDeterminism } from "./escalationDeterminismCertifier";
import { validateUncertaintyEscalation } from "./uncertaintyEscalationValidator";
import { verifyEscalationLineage } from "./escalationLineageVerifier";
import { enforceOversightEscalation } from "./oversightEscalationEnforcer";
import { certifyRuntimeContainment } from "./runtimeContainmentCertifier";
import { certifyAuthorityBoundary } from "./authorityBoundaryCertifier";
import { validateOrchestrationContainment } from "./orchestrationContainmentValidator";
import { analyzeCertificationContainmentPressure } from "./containmentPressureAnalyzer";
import { certifyAntiEmergence } from "./antiEmergenceCertificationEngine";
import { detectCertificationRecursiveCoordination } from "./recursiveCoordinationDetector";
import { detectHiddenExecutionPaths } from "./hiddenExecutionPathDetector";
import { detectCertificationAuthorityExpansion } from "./authorityExpansionDetector";
import { validateCertificationOrchestrationDrift } from "./orchestrationDriftValidator";
import { certifyConstitutionalDriftResistance } from "./constitutionalDriftResistanceCertifier";
import { validateGovernanceDrift } from "./governanceDriftValidator";
import { validateReplayDrift } from "./replayDriftValidator";
import { validateContainmentDrift } from "./containmentDriftValidator";
import { validateEscalationDrift } from "./escalationDriftValidator";
import { validateCertificationIsolationBoundary } from "./certificationIsolationBoundary";
import { validateCertificationAuthorityFirewall } from "./certificationAuthorityFirewall";
import { validateCertificationExecutionBlocker } from "./certificationExecutionBlocker";
import { validateCertificationContainmentBoundary } from "./certificationContainmentBoundary";
import { aggregateCertificationReadiness } from "./constitutionalCertificationAggregator";
import { evaluateCertificationPolicy } from "./constitutionalCertificationPolicyEngine";
import { decideCertification } from "./certificationDecisionEngine";
import { generateCertificationEvidence } from "./constitutionalCertificationEvidenceGenerator";
import { appendCertificationLedger, appendCertificationLineage } from "./immutableCertificationLineageLog";
import { hashCertificationValue } from "./certificationTraceHasher";

function buildScorecard(input: {
  governance: number;
  replay: number;
  containment: number;
  supremacy: number;
  escalation: number;
  override: number;
  drift: number;
  runtime: number;
  antiEmergence: number;
}): CertificationScorecard {
  return Object.freeze({
    governanceIntegrity: input.governance,
    replayDeterminism: input.replay,
    containmentStrength: input.containment,
    humanSupremacy: input.supremacy,
    escalationDeterminism: input.escalation,
    overrideReliability: input.override,
    driftResistance: input.drift,
    runtimeCompatibility: input.runtime,
    antiEmergenceIntegrity: input.antiEmergence,
    scoreHash: hashCertificationValue("constitutional-certification-scorecard", input),
  });
}

function createExport(input: {
  certificationId: string;
  evidenceHash: string;
  lineageHash: string;
  reportHash: string;
  policyHash: string;
}) {
  return Object.freeze({
    exportId: hashCertificationValue("constitutional-certification-export-id", {
      certificationId: input.certificationId,
    }),
    certificationId: input.certificationId,
    evidenceHash: input.evidenceHash,
    lineageHash: input.lineageHash,
    reportHash: input.reportHash,
    policyHash: input.policyHash,
    exportHash: hashCertificationValue("constitutional-certification-export", input),
  });
}

export function buildConstitutionalCertification(
  input: ConstitutionalCertificationInput,
): ConstitutionalCertificationResult {
  const schemaErrors = validateConstitutionalCertificationInput(input);
  const governanceImmutability = certifyGovernanceImmutability(input);
  const governanceSupremacyErrors = validateGovernanceSupremacy(input);
  const governanceBypassErrors = detectGovernanceBypass(input);
  const policyLineageErrors = certifyPolicyLineage(input);
  const replayCertification = certifyDeterministicReplay(input);
  const replayIntegrityErrors = validateReplayIntegrity(input);
  const replayLineageErrors = verifyReplayLineage(input);
  const replayTruthErrors = validateReplayHistoricalTruth(input);
  const humanSupremacyCertification = certifyHumanSupremacyForCertification(input);
  const overrideErrors = certifyOverridePropagation(input);
  const operatorErrors = validateOperatorAuthority(input);
  const killSwitchErrors = validateConstitutionalKillSwitch(input);
  const escalationCertification = certifyEscalationDeterminism(input);
  const uncertaintyEscalationErrors = validateUncertaintyEscalation(input);
  const escalationLineageErrors = verifyEscalationLineage(input);
  const oversightErrors = enforceOversightEscalation(input);
  const containmentCertification = certifyRuntimeContainment(input);
  const authorityBoundaryCertification = certifyAuthorityBoundary(input);
  const orchestrationContainmentErrors = validateOrchestrationContainment(input);
  const containmentPressure = analyzeCertificationContainmentPressure(input);
  const antiEmergenceCertification = certifyAntiEmergence(input);
  const recursiveCoordinationErrors = detectCertificationRecursiveCoordination(input);
  const hiddenExecutionErrors = detectHiddenExecutionPaths(input);
  const authorityExpansionErrors = detectCertificationAuthorityExpansion(input);
  const orchestrationDriftErrors = validateCertificationOrchestrationDrift(input);
  const driftResistanceCertification = certifyConstitutionalDriftResistance(input);
  const governanceDriftErrors = validateGovernanceDrift(input);
  const replayDriftErrors = validateReplayDrift(input);
  const containmentDriftErrors = validateContainmentDrift(input);
  const escalationDriftErrors = validateEscalationDrift(input);
  const isolationErrors = validateCertificationIsolationBoundary(input);
  const authorityFirewallErrors = validateCertificationAuthorityFirewall(input);
  const executionBlockerErrors = validateCertificationExecutionBlocker(input);
  const containmentBoundaryErrors = validateCertificationContainmentBoundary(input);

  const scorecard = buildScorecard({
    governance: governanceImmutability.record.score,
    replay: replayCertification.record.score,
    containment: containmentCertification.record.score,
    supremacy: humanSupremacyCertification.record.score,
    escalation: escalationCertification.record.score,
    override: input.constitutionalReadinessResult.overrideReliability.score,
    drift: driftResistanceCertification.record.score,
    runtime: input.constitutionalReadinessResult.runtimeCompatibility.score,
    antiEmergence: antiEmergenceCertification.record.score,
  });
  const aggregation = aggregateCertificationReadiness({
    certificationInput: input,
    scorecard,
  });
  const policy = evaluateCertificationPolicy({
    certificationInput: input,
    containmentStrength: containmentCertification.record.score,
    autonomyCapabilityGrowth: containmentPressure,
  });

  const errors = Object.freeze([
    ...schemaErrors,
    ...governanceImmutability.errors,
    ...governanceSupremacyErrors,
    ...governanceBypassErrors,
    ...policyLineageErrors,
    ...replayCertification.errors,
    ...replayIntegrityErrors,
    ...replayLineageErrors,
    ...replayTruthErrors,
    ...humanSupremacyCertification.errors,
    ...overrideErrors,
    ...operatorErrors,
    ...killSwitchErrors,
    ...escalationCertification.errors,
    ...uncertaintyEscalationErrors,
    ...escalationLineageErrors,
    ...oversightErrors,
    ...containmentCertification.errors,
    ...authorityBoundaryCertification.errors,
    ...orchestrationContainmentErrors,
    ...antiEmergenceCertification.errors,
    ...recursiveCoordinationErrors,
    ...hiddenExecutionErrors,
    ...authorityExpansionErrors,
    ...orchestrationDriftErrors,
    ...driftResistanceCertification.errors,
    ...governanceDriftErrors,
    ...replayDriftErrors,
    ...containmentDriftErrors,
    ...escalationDriftErrors,
    ...isolationErrors,
    ...authorityFirewallErrors,
    ...executionBlockerErrors,
    ...containmentBoundaryErrors,
  ]);

  const decision = decideCertification({
    aggregateScore: aggregation.aggregateScore,
    containmentDominatesAutonomy: policy.containmentDominatesAutonomy,
    errors,
  });
  const certified = decision === "CERTIFIED" || decision === "CONDITIONALLY_CERTIFIED";
  const failClosed = !certified;
  const evidence = generateCertificationEvidence({
    certificationInput: input,
    reasons: Object.freeze(errors.map((error) => error.code)),
  });
  const report = Object.freeze({
    certificationId: input.certificationId,
    advisoryOnly: true as const,
    executionAuthorized: false as const,
    runtimeMutationAllowed: false as const,
    authorityMutationAllowed: false as const,
    governanceMutationAllowed: false as const,
    orchestrationAllowed: false as const,
    operatorReviewRequired: true as const,
    decision,
    certified,
    aggregateScore: aggregation.aggregateScore,
    confidenceScore: aggregation.confidenceScore,
    uncertaintyPenalty: aggregation.uncertaintyPenalty,
    failClosed,
    constitutionalViolations: Object.freeze(errors.map((error) => error.code)),
    reportHash: hashCertificationValue("constitutional-certification-report", {
      certificationId: input.certificationId,
      decision,
      certified,
      aggregateScore: aggregation.aggregateScore,
      confidenceScore: aggregation.confidenceScore,
      uncertaintyPenalty: aggregation.uncertaintyPenalty,
      failClosed,
      constitutionalViolations: errors.map((error) => error.code),
    }),
  });

  const lineageEntry: CertificationLineageEntry = Object.freeze({
    entryId: hashCertificationValue("constitutional-certification-lineage-entry-id", {
      certificationId: input.certificationId,
      createdAt: input.createdAt,
    }),
    certificationId: input.certificationId,
    coordinationId: input.constitutionalReadinessResult.record.coordinationId,
    decision,
    aggregateScore: aggregation.aggregateScore,
    createdAt: input.createdAt,
    deterministicHash: hashCertificationValue("constitutional-certification-lineage-entry", {
      certificationId: input.certificationId,
      decision,
      aggregateScore: aggregation.aggregateScore,
      evidenceHash: evidence.evidenceHash,
    }),
  });
  const lineage = appendCertificationLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const primaryLedger = appendCertificationLedger({
    existing: input.existingReplayLedger,
    payload: Object.freeze({
      event: "constitutional.certification.evaluated",
      certificationId: input.certificationId,
      decision,
      aggregateScore: aggregation.aggregateScore,
      evidenceHash: evidence.evidenceHash,
      lineageHash: lineage.lineageHash,
    }),
    scope: "constitutional-certification",
  });
  const replayLedger = appendCertificationLedger({
    existing: primaryLedger,
    payload: Object.freeze({
      event: failClosed ? "constitutional.certification.failed_closed" : "constitutional.certification.certified",
      certificationId: input.certificationId,
      decision,
      reportHash: report.reportHash,
      policyHash: policy.policyHash,
    }),
    scope: "constitutional-certification-audit",
  });
  const exportArtifact = createExport({
    certificationId: input.certificationId,
    evidenceHash: evidence.evidenceHash,
    lineageHash: lineage.lineageHash,
    reportHash: report.reportHash,
    policyHash: policy.policyHash,
  });

  const record = Object.freeze({
    certificationId: input.certificationId,
    coordinationId: input.constitutionalReadinessResult.record.coordinationId,
    readinessId: input.constitutionalReadinessResult.record.readinessId,
    replayId: input.constitutionalReadinessResult.record.replayId,
    supremacyId: input.constitutionalReadinessResult.record.supremacyId,
    escalationId: input.constitutionalReadinessResult.record.escalationId,
    containmentId: input.constitutionalReadinessResult.record.containmentId,
    boundaryId: input.constitutionalAuthorityBoundaryResult.record.boundaryId,
    admissibilityId: input.constitutionalReadinessResult.record.admissibilityId,
    telemetryId: input.constitutionalReadinessResult.record.telemetryId,
    simulationId: input.constitutionalReadinessResult.record.simulationId,
    governanceSnapshotId: input.constitutionalReadinessResult.record.governanceSnapshotId,
    replaySnapshotId: input.constitutionalReadinessResult.record.replaySnapshotId,
    decision,
    failClosed,
    governanceBound: input.constitutionalReadinessResult.record.governanceBound,
    replaySafe: input.constitutionalReadinessResult.record.replaySafe,
    createdAt: input.createdAt,
  });

  return Object.freeze({
    record,
    scorecard,
    aggregation,
    policy,
    governanceImmutability: governanceImmutability.record,
    replayCertification: replayCertification.record,
    humanSupremacyCertification: humanSupremacyCertification.record,
    escalationCertification: escalationCertification.record,
    containmentCertification: containmentCertification.record,
    antiEmergenceCertification: antiEmergenceCertification.record,
    authorityBoundaryCertification: authorityBoundaryCertification.record,
    driftResistanceCertification: driftResistanceCertification.record,
    evidence,
    report,
    lineage,
    replayLedger,
    export: exportArtifact,
    warnings: Object.freeze(failClosed
      ? ["Certification failed closed and increased oversight under uncertainty."]
      : ["Certification remained advisory-only and did not grant operational authority."]),
    errors,
    deterministicHash: hashCertificationValue("constitutional-certification-result", {
      certificationId: input.certificationId,
      decision,
      evidenceHash: evidence.evidenceHash,
      lineageHash: lineage.lineageHash,
      reportHash: report.reportHash,
      exportHash: exportArtifact.exportHash,
      policyHash: policy.policyHash,
      aggregationHash: aggregation.aggregateHash,
      scoreHash: scorecard.scoreHash,
    }),
    derivedOnly: true as const,
  });
}

export const certifyConstitutionalReadiness = buildConstitutionalCertification;
