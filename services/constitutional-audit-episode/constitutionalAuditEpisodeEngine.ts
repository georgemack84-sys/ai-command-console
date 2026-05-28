import type {
  ConstitutionalAuditEpisode,
  ConstitutionalAuditEpisodeInput,
  ConstitutionalAuditEpisodeRecord,
  ConstitutionalAuditEpisodeResult,
  ConstitutionalAuditLineageEntry,
  ConstitutionalAuditSeverity,
  ConstitutionalRiskAnalysisRecord,
  LineageRef,
} from "@/types/constitutional-audit-episode";
import { buildConstitutionalAuditAuthorityContract } from "./constitutionalEpisodeContracts";
import { bindConstitutionalGovernanceSnapshot } from "./constitutionalGovernanceSnapshotBinder";
import { reconstructApprovalDependencies } from "./approvalDependencyReconstructor";
import { reconstructEscalationCausality } from "./escalationCausalityEngine";
import { trackOperatorInterventions } from "./operatorInterventionTracker";
import { validateConstitutionalReplayConsistency } from "./replayConsistencyValidator";
import { reconstructConstitutionalOutcome } from "./constitutionalOutcomeReconstructor";
import { validateConstitutionalEpisodeBoundary } from "./constitutionalEpisodeBoundaryValidator";
import { validateConstitutionalEpisodeIsolation } from "./constitutionalEpisodeIsolationValidator";
import { validateConstitutionalEpisodeContainment } from "./constitutionalEpisodeContainmentValidator";
import { detectConstitutionalDisputes } from "./constitutionalDisputeEngine";
import { verifyConstitutionalEpisodeReplay } from "./constitutionalEpisodeReplayVerifier";
import { appendImmutableConstitutionalEpisodeLedger } from "./immutableConstitutionalEpisodeLedger";
import { appendConstitutionalAuditLedger } from "./constitutionalAuditLedger";
import { buildConstitutionalAuditEvidence } from "./constitutionalEvidenceBuilder";
import { resolveConstitutionalEpisodeState } from "./constitutionalEpisodeFailClosedCoordinator";
import { freezeConstitutionalEpisodeState } from "./constitutionalEpisodeFreezeCoordinator";
import { buildConstitutionalLineageGraph } from "./constitutionalLineageGraph";
import { appendConstitutionalEpisodeLineage } from "./internalConstitutionalEpisodeLineageEngine";
import { hashConstitutionalAuditValue } from "./constitutionalEpisodeHashEngine";

function buildLineageRef(sourceType: string, sourceId: string, deterministicHash: string): LineageRef {
  return Object.freeze({
    lineageId: hashConstitutionalAuditValue(`constitutional-audit-lineage-ref-id:${sourceType}`, sourceId),
    sourceId,
    sourceType,
    deterministicHash,
  });
}

function classifySeverity(errors: readonly { code: string }[]): ConstitutionalAuditSeverity {
  if (errors.some((item) => item.code.includes("PRIVILEGE") || item.code.includes("SYNTHETIC") || item.code.includes("ISOLATION"))) {
    return "critical";
  }
  if (errors.length > 0) {
    return "high";
  }
  return "low";
}

function buildRiskAnalysis(input: ConstitutionalAuditEpisodeInput, errors: readonly { code: string }[]): readonly ConstitutionalRiskAnalysisRecord[] {
  return Object.freeze([
    Object.freeze({
      analysisId: hashConstitutionalAuditValue("constitutional-audit-risk-analysis-id", input.episodeId),
      category: "CONSTITUTIONAL_CAUSALITY",
      severity: classifySeverity(errors),
      rationale: errors.length > 0
        ? "Historical reconstruction detected constitutional risk or ambiguity that requires review."
        : "Historical reconstruction remains deterministic and governance-bound.",
      advisoryOnly: true as const,
      deterministicHash: hashConstitutionalAuditValue("constitutional-audit-risk-analysis", {
        episodeId: input.episodeId,
        errors: errors.map((item) => item.code),
      }),
    }),
  ]);
}

export function buildConstitutionalAuditEpisode(
  input: ConstitutionalAuditEpisodeInput,
): ConstitutionalAuditEpisodeResult {
  const authorityContract = buildConstitutionalAuditAuthorityContract();
  const replayErrors = validateConstitutionalReplayConsistency(input);
  const boundaryErrors = validateConstitutionalEpisodeBoundary(input);
  const isolationErrors = validateConstitutionalEpisodeIsolation(input);
  const containmentErrors = validateConstitutionalEpisodeContainment(input);
  const governanceValidation = bindConstitutionalGovernanceSnapshot(input);
  const approvalDependencies = reconstructApprovalDependencies(input);
  const escalationDecisions = reconstructEscalationCausality(input);
  const operatorInterventions = trackOperatorInterventions(input);
  const outcomes = reconstructConstitutionalOutcome(input);

  const governanceErrors = governanceValidation.some((item) => !item.governanceBound)
    ? [Object.freeze({
      code: "CONSTITUTIONAL_AUDIT_GOVERNANCE_MISMATCH" as const,
      message: "Governance snapshot binding is ambiguous or detached.",
      path: "futureAutonomyResult.record.governanceSnapshotId",
    })]
    : [];
  const approvalErrors = approvalDependencies.some((item) => item.dependencyState !== "stable")
    ? [Object.freeze({
      code: "CONSTITUTIONAL_AUDIT_APPROVAL_MISMATCH" as const,
      message: "Approval dependency reconstruction is ambiguous or inconsistent.",
      path: "futureAutonomyResult.evidence.approvalLineageId",
    })]
    : [];
  const escalationErrors = escalationDecisions.some((item) => item.escalationState === "frozen")
    && input.futureAutonomyResult.result.status === "safe"
    ? [Object.freeze({
      code: "CONSTITUTIONAL_AUDIT_ESCALATION_MISMATCH" as const,
      message: "Escalation causality does not match the simulated constitutional state.",
      path: "futureAutonomyResult.result.status",
    })]
    : [];

  const normalized = JSON.stringify(input.metadata ?? {}).toLowerCase().replace(/[^a-z0-9]+/g, "");
  const metadataErrors = [
    normalized.includes("missinglineage") || normalized.includes("lineagefabrication")
      ? Object.freeze({
        code: "CONSTITUTIONAL_AUDIT_LINEAGE_CORRUPTION" as const,
        message: "Lineage corruption or fabrication detected.",
        path: "metadata",
      })
      : null,
    normalized.includes("validatordrift")
      ? Object.freeze({
        code: "CONSTITUTIONAL_AUDIT_VALIDATOR_DRIFT" as const,
        message: "Validator drift detected during constitutional replay verification.",
        path: "metadata",
      })
      : null,
    normalized.includes("operatorambiguity")
      ? Object.freeze({
        code: "CONSTITUTIONAL_AUDIT_OPERATOR_AMBIGUITY" as const,
        message: "Operator intervention reconstruction is ambiguous.",
        path: "metadata",
      })
      : null,
  ].filter(Boolean) as readonly {
    code: "CONSTITUTIONAL_AUDIT_LINEAGE_CORRUPTION" | "CONSTITUTIONAL_AUDIT_VALIDATOR_DRIFT" | "CONSTITUTIONAL_AUDIT_OPERATOR_AMBIGUITY";
    message: string;
    path: string;
  }[];

  const errors = Object.freeze([
    ...replayErrors,
    ...boundaryErrors,
    ...isolationErrors,
    ...containmentErrors,
    ...governanceErrors,
    ...approvalErrors,
    ...escalationErrors,
    ...metadataErrors,
  ]);

  const disputes = detectConstitutionalDisputes({
    episodeInput: input,
    errors,
  });
  const replayVerification = verifyConstitutionalEpisodeReplay(input, disputes.length > 0);
  const riskAnalysis = buildRiskAnalysis(input, errors);

  const observationLineage = Object.freeze([
    buildLineageRef("observation", input.futureAutonomyResult.record.simulationId, input.futureAutonomyResult.hashes.simulationHash),
  ]);
  const interpretationLineage = Object.freeze([
    buildLineageRef("interpretation", input.futureAutonomyResult.record.driftId, input.futureAutonomyResult.hashes.replayHash),
  ]);
  const recommendationLineage = Object.freeze([
    buildLineageRef("recommendation", input.futureAutonomyResult.record.recommendationId, input.futureAutonomyResult.hashes.finalResultHash),
  ]);

  const constitutionalStateHash = hashConstitutionalAuditValue("constitutional-audit-state", {
    observationLineage,
    interpretationLineage,
    recommendationLineage,
    riskAnalysis,
    escalationDecisions,
    approvalDependencies,
    governanceValidation,
    operatorInterventions,
    outcomes,
    replayVerification,
  });

  const episode: ConstitutionalAuditEpisode = Object.freeze({
    episodeId: input.episodeId,
    governanceSnapshotId: input.futureAutonomyResult.record.governanceSnapshotId,
    replaySnapshotId: input.futureAutonomyResult.record.replaySnapshotId,
    observationLineage,
    interpretationLineage,
    recommendationLineage,
    riskAnalysis,
    escalationDecisions,
    approvalDependencies,
    governanceValidation,
    operatorInterventions,
    outcomes,
    replayVerification,
    constitutionalStateHash,
    createdAt: input.createdAt,
  });

  const severity = classifySeverity(errors);
  const preFreezeState = resolveConstitutionalEpisodeState({
    errors,
    disputesDetected: disputes.length > 0,
    inheritedFailClosed: input.futureAutonomyResult.record.failClosed,
    severity,
  });
  const episodeState = freezeConstitutionalEpisodeState(preFreezeState);

  const evidence = buildConstitutionalAuditEvidence({
    episodeInput: input,
    evidenceRefs: Object.freeze([
      input.futureAutonomyResult.evidence.evidenceId,
      input.futureAutonomyResult.record.simulationId,
      ...disputes.map((item) => item.disputeId),
    ]),
    reasons: Object.freeze(errors.map((item) => item.code)),
  });

  const lineageEntry: ConstitutionalAuditLineageEntry = Object.freeze({
    entryId: hashConstitutionalAuditValue("constitutional-audit-lineage-entry-id", {
      episodeId: input.episodeId,
      createdAt: input.createdAt,
    }),
    episodeId: input.episodeId,
    coordinationId: input.futureAutonomyResult.record.coordinationId,
    episodeState,
    disputeDetected: disputes.length > 0,
    createdAt: input.createdAt,
    deterministicHash: hashConstitutionalAuditValue("constitutional-audit-lineage-entry", {
      episodeId: input.episodeId,
      episodeState,
      evidenceHash: evidence.evidenceHash,
    }),
  });
  const lineage = appendConstitutionalEpisodeLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const lineageGraph = buildConstitutionalLineageGraph(lineage);
  const replayLedger = appendImmutableConstitutionalEpisodeLedger({
    existing: input.existingReplayLedger,
    payload: Object.freeze({
      event: "episode.created",
      episodeId: input.episodeId,
      episodeState,
      lineageHash: lineage.lineageHash,
      evidenceHash: evidence.evidenceHash,
    }),
    scope: "constitutional-audit-episode",
  });
  const auditLedger = appendConstitutionalAuditLedger({
    existing: replayLedger,
    payload: Object.freeze({
      event: disputes.length > 0 ? "dispute.detected" : "replay.verified",
      episodeId: input.episodeId,
      episodeState,
      replayVerificationHash: replayVerification.verificationHash,
      lineageHash: lineage.lineageHash,
    }),
    scope: "constitutional-audit-episode-audit",
  });

  const record: ConstitutionalAuditEpisodeRecord = Object.freeze({
    episodeId: input.episodeId,
    coordinationId: input.futureAutonomyResult.record.coordinationId,
    simulationId: input.futureAutonomyResult.record.simulationId,
    driftId: input.futureAutonomyResult.record.driftId,
    governanceSnapshotId: input.futureAutonomyResult.record.governanceSnapshotId,
    replaySnapshotId: input.futureAutonomyResult.record.replaySnapshotId,
    episodeState,
    replaySafe: replayVerification.replayVerified,
    failClosed: episodeState === "blocked" || episodeState === "frozen" || episodeState === "disputed",
    createdAt: input.createdAt,
  });

  const hashes = Object.freeze({
    episodeHash: hashConstitutionalAuditValue("constitutional-audit-episode-hash", episode),
    constitutionalStateHash,
    lineageHash: lineage.lineageHash,
    replayHash: replayVerification.verificationHash,
    governanceHash: governanceValidation[0]?.deterministicHash ?? "missing",
    approvalHash: approvalDependencies[0]?.deterministicHash ?? "missing",
    escalationHash: escalationDecisions[0]?.deterministicHash ?? "missing",
    outcomeHash: outcomes[0]?.deterministicHash ?? "missing",
    evidenceHash: evidence.evidenceHash,
    finalResultHash: hashConstitutionalAuditValue("constitutional-audit-final-result-hash", {
      episodeId: input.episodeId,
      episodeState,
      constitutionalStateHash,
      replayHash: replayVerification.verificationHash,
      evidenceHash: evidence.evidenceHash,
    }),
  });

  return Object.freeze({
    record,
    authorityContract,
    episode,
    disputes,
    lineage,
    lineageGraph,
    replayLedger: auditLedger,
    evidence,
    hashes,
    warnings: Object.freeze([]),
    errors,
    deterministicHash: hashes.finalResultHash,
    derivedOnly: true as const,
  });
}

export const detectConstitutionalAuditEpisode = buildConstitutionalAuditEpisode;
