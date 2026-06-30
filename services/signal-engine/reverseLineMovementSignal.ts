import { calculateMarketSideStrength } from "./marketSideStrength";
import { getConsensusAgeSeconds, parsePublicConsensusSnapshot } from "./publicConsensus";
import { resolveReverseLineMovementThresholds } from "./reverseLineMovementThresholds";
import type {
  PublicConsensusSnapshot,
  ReverseLineConfidenceFactors,
  ReverseLineMovementEvidence,
  ReverseLineMovementThresholds,
  ReverseLineReplayInput,
  ReverseLineSignalEvaluation,
  VerifiedMovementEvent,
} from "./types";

function buildConfidenceFactors(
  snapshot: PublicConsensusSnapshot,
  movementSize: number,
  sourceCount: number,
  consensusAgeSeconds: number,
): ReverseLineConfidenceFactors {
  return Object.freeze({
    public_percentage: snapshot.public_percentage,
    movement_size: movementSize,
    source_count: sourceCount,
    consensus_age_seconds: consensusAgeSeconds,
    consensus_verification_status: snapshot.verification_status === "LIMITED" ? "LIMITED" : "VERIFIED",
    evidence_completeness: true,
  });
}

export function evaluateReverseLineMovementSignal(
  event: VerifiedMovementEvent,
  thresholds: Partial<ReverseLineMovementThresholds> = {},
): ReverseLineSignalEvaluation {
  const resolvedThresholds = resolveReverseLineMovementThresholds(thresholds);

  if (resolvedThresholds.require_verified_movement_event && event.verification_status !== "VERIFIED") {
    return {
      status: "REJECTED",
      reasons: ["Only verified movement events may produce a reverse line movement signal."],
      rejection_code: "EVENT_NOT_VERIFIED",
    };
  }

  const snapshot = parsePublicConsensusSnapshot(event.payload.public_consensus_snapshot);
  if (!snapshot) {
    return {
      status: "REJECTED",
      reasons: ["Public consensus snapshot is required for reverse line movement detection."],
      rejection_code: "MISSING_EVIDENCE",
    };
  }
  if (snapshot.verification_status === "INVALID") {
    return {
      status: "REJECTED",
      reasons: ["Public consensus snapshot is invalid."],
      rejection_code: "MISSING_EVIDENCE",
    };
  }

  const marketStrength = calculateMarketSideStrength(event);
  if (!marketStrength) {
    return {
      status: "REJECTED",
      reasons: ["Market side strength could not be derived from the movement event."],
      rejection_code: "MISSING_EVIDENCE",
    };
  }

  if (snapshot.public_percentage < resolvedThresholds.minimum_public_percentage) {
    return {
      status: "NO_SIGNAL",
      reasons: ["Public consensus did not meet the reverse line movement threshold."],
    };
  }
  if (marketStrength.movement_size < resolvedThresholds.minimum_movement_size) {
    return {
      status: "NO_SIGNAL",
      reasons: ["Movement size did not meet the reverse line movement threshold."],
    };
  }

  const consensusAgeSeconds = getConsensusAgeSeconds(snapshot, event.timestamp);
  if (consensusAgeSeconds === null) {
    return {
      status: "REJECTED",
      reasons: ["Public consensus timing could not be validated."],
      rejection_code: "MISSING_EVIDENCE",
    };
  }
  if (consensusAgeSeconds > resolvedThresholds.maximum_consensus_age_seconds) {
    return {
      status: "NO_SIGNAL",
      reasons: ["Public consensus snapshot is too old for reverse line movement detection."],
    };
  }

  const publicSideMatches = snapshot.public_side === marketStrength.market_side_strengthened;
  if (publicSideMatches) {
    return {
      status: "NO_SIGNAL",
      reasons: ["Market movement aligned with public consensus."],
    };
  }

  const evidence: ReverseLineMovementEvidence = Object.freeze({
    public_side: snapshot.public_side,
    public_percentage: snapshot.public_percentage,
    opposing_side: snapshot.opposing_side,
    movement_direction: marketStrength.movement_direction,
    market_side_strengthened: marketStrength.market_side_strengthened,
    previous_line: marketStrength.previous_line,
    new_line: marketStrength.new_line,
    source_ids: [...event.source_ids].sort(),
    source_count: event.source_ids.length,
    timestamp: event.timestamp,
    public_consensus_reference: {
      source_id: snapshot.source_id,
      captured_at: snapshot.captured_at,
      consensus_type: snapshot.consensus_type,
    },
    comparison_result: {
      public_side_matches_market_strengthened_side: false,
      reverse_detected: true,
      divergence_size: Number((snapshot.public_percentage - snapshot.opposing_percentage).toFixed(4)),
    },
  });

  const replayInput: ReverseLineReplayInput = Object.freeze({
    movement_event: event.event_id,
    public_consensus_snapshot: {
      consensus_id: snapshot.consensus_id,
      source_id: snapshot.source_id,
      captured_at: snapshot.captured_at,
      public_side: snapshot.public_side,
      public_percentage: snapshot.public_percentage,
      verification_status: snapshot.verification_status,
    },
    thresholds: resolvedThresholds,
    classifier_version: "reverse-line-classifier/v1",
    schema_version: event.schema_version,
  });

  return {
    status: "SIGNAL",
    reasons: [
      "Market movement diverges from public consensus.",
      `Public consensus favored ${snapshot.public_side} at ${snapshot.public_percentage}%.`,
      `Verified market movement strengthened ${marketStrength.market_side_strengthened}.`,
    ],
    evidence,
    confidence_factors: buildConfidenceFactors(snapshot, marketStrength.movement_size, event.source_ids.length, consensusAgeSeconds),
    replay_input: replayInput,
  };
}
