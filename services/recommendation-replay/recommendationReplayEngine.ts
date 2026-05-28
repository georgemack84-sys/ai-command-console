import { verifyImmutableLedgerChain } from "@/services/audit/immutableAuditLedger";
import { reconstructConfidenceReplay } from "./confidenceReplayReconstructor";
import { reconstructConstraintReplay } from "./constraintReplayReconstructor";
import { reconstructEvidenceReplay } from "./evidenceReplayContractLayer";
import { reconstructGovernanceReplay } from "./governanceReplayReconstructor";
import { buildReplayAuditRecord, appendReplayAuditEntry } from "./immutableReplayAuditLog";
import { detectReplayAntiEmergence } from "./replayAntiEmergenceDetector";
import { validateReplayDeterminism } from "./replayDeterminismValidator";
import { buildReplayFreezeRecord, deriveReplayStatus } from "./replayFailClosedGuard";
import { hashReplayValue } from "./replayHashEngine";
import { reconstructRecommendationLineage } from "./recommendationLineageReconstructor";
import { validateReplayLineage } from "./replayLineageValidator";
import type {
  RecommendationReplayEpisode,
  RecommendationReplayError,
  RecommendationReplayInput,
  RecommendationReplayResult,
  RecommendationReplayStageRecord,
} from "./types/recommendationReplayTypes";

function buildStages(errors: readonly RecommendationReplayError[]): readonly RecommendationReplayStageRecord[] {
  const reasons = Object.freeze(errors.map((error) => error.code));
  return Object.freeze([
    "lineage_reconstruction",
    "evidence_reconstruction",
    "governance_reconstruction",
    "confidence_reconstruction",
    "constraint_reconstruction",
    "determinism_validation",
    "anti_emergence",
    "audit",
    "fail_closed",
  ].map((stage) => Object.freeze({
    stage,
    passed: errors.length === 0,
    reasons,
    deterministicHash: hashReplayValue("recommendation-replay-stage", { stage, reasons }),
  })));
}

function validateInput(input: RecommendationReplayInput): RecommendationReplayError[] {
  const errors: RecommendationReplayError[] = [];
  if (!input.replayRunId || !input.recommendationId) {
    errors.push({
      code: "RECOMMENDATION_REPLAY_INVALID_INPUT",
      message: "Replay run ID and recommendation ID are required.",
      path: "replayRunId",
    });
  }
  if (!verifyImmutableLedgerChain([...(input.existingAuditLedger ?? [])])) {
    errors.push({
      code: "RECOMMENDATION_REPLAY_AUDIT_FAILURE",
      message: "Existing replay audit ledger is invalid.",
      path: "existingAuditLedger",
    });
  }
  return errors;
}

export function replayRecommendationEpisode(
  input: RecommendationReplayInput,
): RecommendationReplayResult {
  const errors: RecommendationReplayError[] = [...validateInput(input)];

  const lineage = reconstructRecommendationLineage(input);
  const { evidenceReplay, errors: evidenceErrors } = reconstructEvidenceReplay(input);
  const { confidenceReplay, errors: confidenceErrors } = reconstructConfidenceReplay(input);
  const governanceReplay = reconstructGovernanceReplay(input);
  const constraintReplay = reconstructConstraintReplay(input);

  errors.push(...evidenceErrors, ...confidenceErrors);

  const preliminaryEpisode: RecommendationReplayEpisode = Object.freeze({
    replayId: `${input.replayRunId}:${input.recommendationId}`,
    recommendationId: input.recommendationId,
    replayTimestamp: input.replayTimestamp,
    lineage: {
      synthesisEpisodeId: lineage.synthesisEpisodeId,
      evidenceLineageId: lineage.evidenceLineageId,
      governanceLineageId: lineage.governanceLineageId,
      confidenceLineageId: lineage.confidenceLineageId,
      constraintLineageId: lineage.constraintLineageId,
      prioritizationLineageId: lineage.prioritizationLineageId,
    },
    evidenceReplay,
    governanceReplay,
    confidenceReplay,
    constraintReplay,
    validation: {
      deterministicReplayVerified: false,
      lineageIntegrityVerified: false,
      governanceConsistencyVerified: false,
    },
    executionAuthorized: false as const,
    runtimeMutationOccurred: false as const,
    scheduledActionCreated: false as const,
    authorityChanged: false as const,
    operatorReviewRequired: true as const,
    replayHash: "",
  });

  const replayHash = hashReplayValue("recommendation-replay-episode", {
    replayId: preliminaryEpisode.replayId,
    recommendationId: preliminaryEpisode.recommendationId,
    lineage: preliminaryEpisode.lineage,
    evidenceReplay: preliminaryEpisode.evidenceReplay,
    governanceReplay: preliminaryEpisode.governanceReplay,
    confidenceReplay: preliminaryEpisode.confidenceReplay,
    constraintReplay: preliminaryEpisode.constraintReplay,
  });

  const episodeWithHash = Object.freeze({
    ...preliminaryEpisode,
    replayHash,
  });

  const validation = validateReplayDeterminism(episodeWithHash);
  const episode: RecommendationReplayEpisode = Object.freeze({
    ...episodeWithHash,
    validation: {
      deterministicReplayVerified: validation.deterministicReplayVerified,
      lineageIntegrityVerified: validation.lineageIntegrityVerified,
      governanceConsistencyVerified: validation.governanceConsistencyVerified,
    },
  });

  errors.push(
    ...validateReplayLineage(input, episode),
    ...detectReplayAntiEmergence(episode),
  );

  if (!validation.deterministicReplayVerified) {
    errors.push({
      code: "RECOMMENDATION_REPLAY_DRIFT",
      message: "Replay serialization is not deterministic.",
      path: `episode.${input.recommendationId}.validation`,
    });
  }
  if (!validation.lineageIntegrityVerified) {
    errors.push({
      code: "RECOMMENDATION_REPLAY_MISSING_LINEAGE",
      message: "Replay lineage integrity could not be verified.",
      path: `episode.${input.recommendationId}.lineage`,
    });
  }
  if (!validation.governanceConsistencyVerified) {
    errors.push({
      code: "RECOMMENDATION_REPLAY_GOVERNANCE_MISMATCH",
      message: "Replay governance consistency could not be verified.",
      path: `episode.${input.recommendationId}.governanceReplay`,
    });
  }
  if (input.recommendationPrioritizationResult.result.status === "FAILED_CLOSED") {
    errors.push({
      code: "RECOMMENDATION_REPLAY_FAIL_CLOSED",
      message: "Replay cannot proceed past a failed-closed prioritization result.",
      path: "recommendationPrioritizationResult.result.status",
    });
  }

  const freeze = buildReplayFreezeRecord(errors);
  const status = deriveReplayStatus(freeze);

  const auditRecord = buildReplayAuditRecord({
    replayId: episode.replayId,
    recommendationId: episode.recommendationId,
    eventType: status === "FAILED_CLOSED"
      ? "REPLAY_FAILED_CLOSED"
      : status === "FROZEN"
        ? "REPLAY_FROZEN"
        : "REPLAY_RECONSTRUCTED",
    replayHash: episode.replayHash,
    timestamp: input.replayTimestamp,
  });
  const auditLedger = appendReplayAuditEntry({
    existing: input.existingAuditLedger ?? [],
    record: auditRecord,
  });

  return Object.freeze({
    status,
    episodes: Object.freeze([episode]),
    lineageRecords: Object.freeze([lineage]),
    validationRecords: Object.freeze([validation]),
    auditRecords: Object.freeze([auditRecord]),
    auditLedger: Object.freeze(auditLedger),
    freeze,
    stages: buildStages(errors),
    errors: Object.freeze(errors),
    warnings: Object.freeze(
      freeze.frozen
        ? ["Recommendation replay froze or failed closed under lineage, governance, or replay uncertainty."]
        : ["Recommendation replay remained reconstructive-only, deterministic, and operator-subordinate."],
    ),
    deterministicHash: hashReplayValue("recommendation-replay-result", {
      replayHash: episode.replayHash,
      lineageHash: lineage.lineageHash,
      validationHash: validation.validationHash,
      auditHash: auditRecord.entryHash,
      freezeHash: freeze.freezeHash,
    }),
    derivedOnly: true as const,
  });
}

export const RecommendationReplayEngine = replayRecommendationEpisode;
