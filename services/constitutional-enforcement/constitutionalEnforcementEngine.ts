import { verifyImmutableLedgerChain } from "@/services/audit/immutableAuditLedger";
import { buildConstitutionalAuditRecord, appendConstitutionalAuditEntry } from "./constitutionalAuditBridge";
import { validateConstitutionalAntiEmergence } from "./constitutionalAntiEmergenceValidator";
import { evaluateSemanticAmbiguity } from "./ambiguityRejectionEngine";
import { buildConstitutionalFreezeRecord } from "./constitutionalFailClosedGuard";
import { validateConstitutionalGovernanceCorrelation } from "./constitutionalGovernanceLinker";
import { hashConstitutionalValue } from "./constitutionalHashLinker";
import { orderSemanticFindingsDeterministically } from "./constitutionalOrderingEngine";
import { reconstructRecommendationReplay } from "./constitutionalReplayAdapter";
import { buildConstitutionalSemanticCorpus, validateRecommendationSemantics } from "./constitutionalSemanticValidator";
import { validateConstitutionalDeterminism } from "./constitutionalDeterminismValidator";
import { buildConstitutionalVerdict } from "./constitutionalVerdictEngine";
import type {
  ConstitutionalAuditRecord,
  ConstitutionalEnforcementError,
  ConstitutionalEnforcementInput,
  ConstitutionalEnforcementResult,
  ConstitutionalEnforcementStageRecord,
  RecommendationLineage,
  SemanticFinding,
} from "./types/constitutionalEnforcementTypes";

function buildStages(errors: readonly ConstitutionalEnforcementError[]): readonly ConstitutionalEnforcementStageRecord[] {
  const reasons = Object.freeze(errors.map((error) => error.code));
  return Object.freeze([
    "semantic_normalization",
    "execution_detection",
    "scheduling_detection",
    "orchestration_detection",
    "capability_analysis",
    "mutation_analysis",
    "ambiguity_evaluation",
    "constitutional_verdict",
    "replay_validation",
    "governance_validation",
    "anti_emergence",
    "audit",
  ].map((stage) => Object.freeze({
    stage,
    passed: errors.length === 0,
    reasons,
    deterministicHash: hashConstitutionalValue("constitutional-enforcement-stage", { stage, reasons }),
  })));
}

function buildLineage(input: ConstitutionalEnforcementInput): RecommendationLineage {
  const episode = input.replayResult.episodes.find((entry) => entry.recommendationId === input.recommendationId)
    ?? input.replayResult.episodes[0]!;

  return Object.freeze({
    lineageId: `constitutional-lineage:${input.recommendationId}:${episode.lineage.synthesisEpisodeId}`,
    recommendationId: input.recommendationId,
    evidenceIds: [...episode.evidenceReplay.normalizedEvidenceRefs],
    governanceSnapshotId: episode.governanceReplay.governanceSnapshotId,
    replaySnapshotId: input.replayInput.recommendationPrioritizationInput.inputs[0]?.replaySnapshotId
      ?? input.replayInput.recommendationSynthesisInput.deterministicReplayResult.snapshot.snapshotId,
    confidenceModelVersion: episode.confidenceReplay.confidenceModelVersion,
    prioritizationModelVersion: input.replayInput.recommendationPrioritizationInput.weightingVersion,
    generatedAt: input.evaluatedAt,
  });
}

function buildTelemetry(input: {
  findings: readonly SemanticFinding[];
  errors: readonly ConstitutionalEnforcementError[];
  verdictStatus: string;
}) {
  const telemetry = Object.freeze({
    recommendationGenerationLatency: 0,
    semanticValidationLatency: 0,
    replayReconstructionLatency: 0,
    governanceRejectionFrequency: input.errors.filter((error) =>
      error.code === "CONSTITUTIONAL_ENFORCEMENT_GOVERNANCE_MISMATCH").length,
    ambiguityRejectionFrequency: input.errors.filter((error) =>
      error.code === "CONSTITUTIONAL_ENFORCEMENT_AMBIGUITY_DETECTED").length,
    executionDetectionRate: input.findings.filter((finding) => finding.category === "execution").length,
    orchestrationDetectionRate: input.findings.filter((finding) => finding.category === "orchestration").length,
    failClosedTriggerRate: input.verdictStatus === "APPROVED" ? 0 : 1,
    telemetryHash: "",
  });

  return Object.freeze({
    ...telemetry,
    telemetryHash: hashConstitutionalValue("constitutional-enforcement-telemetry", telemetry),
  });
}

function buildAuditRecords(input: {
  enforcementRunId: string;
  recommendationId: string;
  timestamp: string;
  verdictStatus: ConstitutionalEnforcementResult["verdict"]["status"];
  findings: readonly SemanticFinding[];
  deterministicHash: string;
}): readonly ConstitutionalAuditRecord[] {
  const events = new Set<ConstitutionalAuditRecord["eventType"]>(["recommendation.validated"]);

  for (const finding of input.findings) {
    if (finding.category === "execution") {
      events.add("execution.semantic.detected");
    } else if (finding.category === "scheduling") {
      events.add("scheduling.semantic.detected");
    } else if (finding.category === "orchestration") {
      events.add("orchestration.semantic.detected");
    } else if (finding.category === "capability_escalation") {
      events.add("capability.escalation.detected");
    } else if (finding.category === "mutation") {
      events.add("mutation.semantic.detected");
    } else if (finding.category === "ambiguity") {
      events.add("ambiguity.detected");
    }
  }

  if (input.verdictStatus === "APPROVED") {
    events.add("recommendation.approved");
  } else {
    events.add("recommendation.rejected");
    events.add("fail.closed.triggered");
  }

  const ordered = [...events].sort((left, right) => left.localeCompare(right));
  return Object.freeze(ordered.map((eventType, index) => buildConstitutionalAuditRecord({
    enforcementRunId: input.enforcementRunId,
    recommendationId: input.recommendationId,
    eventType,
    eventHash: hashConstitutionalValue("constitutional-enforcement-audit-event", {
      eventType,
      recommendationId: input.recommendationId,
      findings: input.findings.map((finding) => finding.findingId),
      verdictStatus: input.verdictStatus,
      deterministicHash: input.deterministicHash,
      index,
    }),
    timestamp: input.timestamp,
  })));
}

function validateInput(input: ConstitutionalEnforcementInput): ConstitutionalEnforcementError[] {
  const errors: ConstitutionalEnforcementError[] = [];

  if (!input.enforcementRunId || !input.recommendationId || !input.evaluatedAt || !input.validatorVersionId) {
    errors.push({
      code: "CONSTITUTIONAL_ENFORCEMENT_INVALID_INPUT",
      message: "Constitutional enforcement requires immutable run, recommendation, timestamp, and validator identifiers.",
      path: "input",
    });
  }
  if (input.replayResult.status !== "COMPLETED") {
    errors.push({
      code: "CONSTITUTIONAL_ENFORCEMENT_REPLAY_INVALID",
      message: "Replay reconstruction must complete before constitutional enforcement.",
      path: "replayResult.status",
    });
  }
  if (input.immutableLedgerResult.status !== "COMPLETED") {
    errors.push({
      code: "CONSTITUTIONAL_ENFORCEMENT_LEDGER_INVALID",
      message: "Immutable recommendation ledger must complete before constitutional enforcement.",
      path: "immutableLedgerResult.status",
    });
  }
  if (!verifyImmutableLedgerChain([...(input.existingAuditLedger ?? [])])) {
    errors.push({
      code: "CONSTITUTIONAL_ENFORCEMENT_FAIL_CLOSED",
      message: "Existing constitutional enforcement audit chain is invalid.",
      path: "existingAuditLedger",
    });
  }

  return errors;
}

export function enforceRecommendationConstitutionality(
  input: ConstitutionalEnforcementInput,
): ConstitutionalEnforcementResult {
  const errors: ConstitutionalEnforcementError[] = [...validateInput(input)];

  const synthesisEnvelope = input.replayInput.recommendationSynthesisResult.recommendations
    .find((entry) => entry.recommendation.recommendationId === input.recommendationId);
  const constrainedEnvelope = input.replayInput.recommendationConstraintResult.constrainedRecommendations
    .find((entry) => entry.constrainedRecommendation.recommendationId === input.recommendationId);

  if (!synthesisEnvelope || !constrainedEnvelope) {
    errors.push({
      code: "CONSTITUTIONAL_ENFORCEMENT_LINEAGE_GAP",
      message: "Recommendation lineage could not be fully reconstructed from immutable upstream artifacts.",
      path: "recommendationId",
    });
  }

  const lineage = buildLineage(input);
  const replay = reconstructRecommendationReplay({
    recommendationId: input.recommendationId,
    replayInput: input.replayInput,
    replayResult: input.replayResult,
    immutableLedgerInput: input.immutableLedgerInput,
    immutableLedgerResult: input.immutableLedgerResult,
    reconstructedAt: input.evaluatedAt,
  });

  const summary = constrainedEnvelope?.sanitizationRecord.sanitizedSummary
    ?? synthesisEnvelope?.recommendation.summary
    ?? "";
  const rationale = constrainedEnvelope?.sanitizationRecord.sanitizedRationale
    ?? synthesisEnvelope?.recommendation.rationale
    ?? "";
  const evidenceReferences = constrainedEnvelope?.constrainedRecommendation.evidenceReferences
    ?? synthesisEnvelope?.recommendation.evidenceReferences
    ?? [];

  const semanticCorpus = buildConstitutionalSemanticCorpus({
    summary,
    rationale,
    replayReasoning: replay.reconstructedReasoning,
    metadata: {
      recommendationMetadata: input.replayInput.metadata,
      immutableLedgerMetadata: input.immutableLedgerInput.metadata,
      enforcementMetadata: input.metadata,
    },
  });

  const semanticFindings = validateRecommendationSemantics({
    recommendationId: input.recommendationId,
    text: semanticCorpus,
    evidenceReferences,
    detectedAt: input.evaluatedAt,
  });

  const governanceErrors = validateConstitutionalGovernanceCorrelation({
    recommendationId: input.recommendationId,
    replayResult: input.replayResult,
    immutableLedgerResult: input.immutableLedgerResult,
    expectedReplaySnapshotId: input.replayInput.recommendationPrioritizationInput.inputs[0]?.replaySnapshotId
      ?? input.replayInput.recommendationSynthesisInput.deterministicReplayResult.snapshot.snapshotId,
  });
  errors.push(...governanceErrors);

  const ambiguity = evaluateSemanticAmbiguity({
    recommendationId: input.recommendationId,
    text: semanticCorpus,
    evidenceReferences,
    detectedAt: input.evaluatedAt,
    lineageComplete: errors.every((error) => error.code !== "CONSTITUTIONAL_ENFORCEMENT_LINEAGE_GAP"),
    governanceConsistent: governanceErrors.length === 0,
    replayConsistent: input.replayResult.validationRecords.every((record) =>
      record.deterministicReplayVerified
      && record.governanceConsistencyVerified
      && record.lineageIntegrityVerified),
    semanticFindings,
  });
  for (const code of ambiguity.freezeReasons) {
    errors.push({
      code,
      message: `Constitutional ambiguity rejection triggered ${code}.`,
      path: "ambiguity",
    });
  }

  const orderedFindings = orderSemanticFindingsDeterministically([
    ...semanticFindings,
    ...ambiguity.findings,
  ]);
  const antiEmergenceErrors = validateConstitutionalAntiEmergence({
    recommendationId: input.recommendationId,
    text: semanticCorpus,
    semanticFindings: orderedFindings,
  });
  errors.push(...antiEmergenceErrors);

  for (const finding of orderedFindings) {
    if (finding.category === "execution") {
      errors.push({
        code: "CONSTITUTIONAL_ENFORCEMENT_EXECUTION_DETECTED",
        message: finding.description,
        path: finding.findingId,
      });
    } else if (finding.category === "scheduling") {
      errors.push({
        code: "CONSTITUTIONAL_ENFORCEMENT_SCHEDULING_DETECTED",
        message: finding.description,
        path: finding.findingId,
      });
    } else if (finding.category === "orchestration") {
      errors.push({
        code: "CONSTITUTIONAL_ENFORCEMENT_ORCHESTRATION_DETECTED",
        message: finding.description,
        path: finding.findingId,
      });
    } else if (finding.category === "capability_escalation") {
      errors.push({
        code: "CONSTITUTIONAL_ENFORCEMENT_CAPABILITY_ESCALATION",
        message: finding.description,
        path: finding.findingId,
      });
    } else if (finding.category === "mutation") {
      errors.push({
        code: "CONSTITUTIONAL_ENFORCEMENT_MUTATION_DETECTED",
        message: finding.description,
        path: finding.findingId,
      });
    }
  }

  const verdict = buildConstitutionalVerdict({
    recommendationId: input.recommendationId,
    evaluatedAt: input.evaluatedAt,
    semanticFindings: orderedFindings,
    ambiguityScore: ambiguity.ambiguityScore,
    rejectionReasons: [
      ...ambiguity.rejectionReasons,
      ...new Set(errors.map((error) => error.message)),
    ],
  });

  errors.push(...validateConstitutionalDeterminism({
    verdict,
    findings: orderedFindings,
    lineage,
    replay,
  }));

  const freeze = buildConstitutionalFreezeRecord({
    verdict,
    errors,
  });
  const status = freeze.failedClosed
    ? "FAILED_CLOSED"
    : freeze.frozen
      ? "FROZEN"
      : "COMPLETED";

  const telemetry = buildTelemetry({
    findings: orderedFindings,
    errors,
    verdictStatus: verdict.status,
  });

  const deterministicHash = hashConstitutionalValue("constitutional-enforcement-result-shape", {
    verdict: verdict.status,
    ambiguityScore: verdict.ambiguityScore,
    findingIds: orderedFindings.map((finding) => finding.findingId),
    lineageId: lineage.lineageId,
    replayId: replay.replayId,
    freezeHash: freeze.freezeHash,
    errorCodes: errors.map((error) => error.code),
  });

  const auditRecords = buildAuditRecords({
    enforcementRunId: input.enforcementRunId,
    recommendationId: input.recommendationId,
    timestamp: input.evaluatedAt,
    verdictStatus: verdict.status,
    findings: orderedFindings,
    deterministicHash,
  });
  const auditLedger = auditRecords.reduce<readonly import("./types/constitutionalEnforcementTypes").ConstitutionalEnforcementLedgerEntry[]>(
    (ledger, record) => appendConstitutionalAuditEntry({ existing: ledger, record }),
    input.existingAuditLedger ?? [],
  );

  return Object.freeze({
    status,
    verdict,
    lineage,
    replay,
    telemetry,
    auditRecords,
    auditLedger,
    freeze,
    stages: buildStages(errors),
    errors: Object.freeze(errors),
    warnings: Object.freeze(
      verdict.status === "APPROVED"
        ? ["Constitutional enforcement approved the recommendation for operator-visible, non-executing use only."]
        : ["Constitutional enforcement rejected or blocked the recommendation under fail-closed containment."],
    ),
    deterministicHash,
    derivedOnly: true as const,
  });
}

export const ConstitutionalEnforcementEngine = enforceRecommendationConstitutionality;
