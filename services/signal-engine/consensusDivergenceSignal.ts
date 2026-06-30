import { measureDivergence } from "./divergenceMeasurement";
import { resolveConsensusDivergenceThresholds } from "./consensusDivergenceThresholds";
import { detectSourceSeparation } from "./sourceSeparation";
import { parseSourceMarketValueSnapshots } from "./sourceValueComparison";
import type {
  ConsensusDivergenceConfidenceFactors,
  ConsensusDivergenceEvidence,
  ConsensusDivergenceReplayInput,
  ConsensusDivergenceSignalEvaluation,
  ConsensusDivergenceThresholds,
  SourceMarketValueSnapshot,
  VerifiedMovementEvent,
} from "./types";

function buildStatus(snapshot: SourceMarketValueSnapshot): "CURRENT" | "STALE" | "LIMITED" | "INVALID" {
  if (snapshot.verification_status === "INVALID") {
    return "INVALID";
  }
  if (snapshot.verification_status === "LIMITED") {
    return "LIMITED";
  }
  if (snapshot.freshness_status === "STALE") {
    return "STALE";
  }
  return "CURRENT";
}

function currentSourceCount(snapshots: SourceMarketValueSnapshot[]): number {
  return snapshots.filter((snapshot) => snapshot.verification_status === "VERIFIED" && snapshot.freshness_status === "CURRENT").length;
}

function staleSourceCount(snapshots: SourceMarketValueSnapshot[]): number {
  return snapshots.filter((snapshot) => snapshot.freshness_status === "STALE").length;
}

function limitedSourceCount(snapshots: SourceMarketValueSnapshot[]): number {
  return snapshots.filter((snapshot) => snapshot.verification_status === "LIMITED").length;
}

function buildConfidenceFactors(
  evidence: ConsensusDivergenceEvidence,
): ConsensusDivergenceConfidenceFactors {
  return Object.freeze({
    source_count: evidence.source_count,
    divergence_size: evidence.divergence_size,
    divergence_state: evidence.divergence_state,
    current_source_count: evidence.freshness_summary.current_source_count,
    stale_source_count: evidence.freshness_summary.stale_source_count,
    limited_source_count: evidence.freshness_summary.limited_source_count,
    evidence_completeness: true,
  });
}

function hasOverlyStaleValues(
  snapshots: SourceMarketValueSnapshot[],
  eventTimestamp: string,
  maxAgeSeconds: number,
): boolean {
  const eventEpoch = Date.parse(eventTimestamp);
  if (Number.isNaN(eventEpoch)) {
    return true;
  }
  return snapshots.some((snapshot) => {
    const snapshotEpoch = Date.parse(snapshot.timestamp);
    if (Number.isNaN(snapshotEpoch)) {
      return true;
    }
    return Math.round((eventEpoch - snapshotEpoch) / 1000) > maxAgeSeconds;
  });
}

export function evaluateConsensusDivergenceSignal(
  event: VerifiedMovementEvent,
  thresholds: Partial<ConsensusDivergenceThresholds> = {},
): ConsensusDivergenceSignalEvaluation {
  if (event.verification_status !== "VERIFIED") {
    return {
      status: "REJECTED",
      reasons: ["Only verified movement events may produce a consensus divergence signal."],
      rejection_code: "EVENT_NOT_VERIFIED",
    };
  }

  const snapshots = parseSourceMarketValueSnapshots(event.payload.source_value_snapshots);
  if (!snapshots || snapshots.length === 0) {
    return {
      status: "REJECTED",
      reasons: ["Source value snapshots are required for consensus divergence detection."],
      rejection_code: "MISSING_EVIDENCE",
    };
  }

  const validSnapshots = snapshots.filter((snapshot) => snapshot.verification_status !== "INVALID");
  if (validSnapshots.length !== snapshots.length || validSnapshots.length === 0) {
    return {
      status: "REJECTED",
      reasons: ["Invalid source values cannot create a consensus divergence signal."],
      rejection_code: "MISSING_EVIDENCE",
    };
  }

  const resolvedThresholds = resolveConsensusDivergenceThresholds(thresholds);
  if (validSnapshots.length < resolvedThresholds.minimum_source_count) {
    return {
      status: "NO_SIGNAL",
      reasons: ["Minimum verified source count was not met."],
    };
  }
  if (hasOverlyStaleValues(validSnapshots, event.timestamp, resolvedThresholds.maximum_snapshot_age_seconds)) {
    return {
      status: "NO_SIGNAL",
      reasons: ["Source value snapshots are too old for consensus divergence detection."],
    };
  }

  const measurement = measureDivergence(validSnapshots, resolvedThresholds);
  if (!measurement) {
    return {
      status: "REJECTED",
      reasons: ["Source values could not be compared for divergence."],
      rejection_code: "MISSING_EVIDENCE",
    };
  }

  if (measurement.divergenceState === "NONE" || measurement.divergenceState === "MINOR") {
    return {
      status: "NO_SIGNAL",
      reasons: ["Consensus divergence did not cross the configured market threshold."],
    };
  }

  const sourceValues = validSnapshots.map((snapshot) => ({
    source_id: snapshot.source_id,
    value: snapshot.value,
    market_type: snapshot.market_type,
    timestamp: snapshot.timestamp,
    status: buildStatus(snapshot),
  }));
  const alignedSourceCount = sourceValues.filter((value) => value.value === measurement.lowestValue || value.value === measurement.highestValue).length === sourceValues.length
    ? Math.max(1, sourceValues.length - 1)
    : sourceValues.filter((value) => value.value === measurement.lowestValue).length;
  const evidence: ConsensusDivergenceEvidence = Object.freeze({
    source_values: sourceValues,
    highest_value: measurement.highestValue,
    lowest_value: measurement.lowestValue,
    divergence_size: measurement.divergenceSize,
    source_count: validSnapshots.length,
    market_type: validSnapshots[0].market_type,
    timestamp: event.timestamp,
    divergence_state: measurement.divergenceState,
    source_alignment: {
      aligned_source_count: alignedSourceCount,
      divergent_source_count: Math.max(0, validSnapshots.length - alignedSourceCount),
      divergence_ratio: Number((Math.max(0, validSnapshots.length - alignedSourceCount) / validSnapshots.length).toFixed(4)),
    },
    freshness_summary: {
      current_source_count: currentSourceCount(validSnapshots),
      stale_source_count: staleSourceCount(validSnapshots),
      limited_source_count: limitedSourceCount(validSnapshots),
    },
    source_separation: detectSourceSeparation(validSnapshots),
  });

  const replayInput: ConsensusDivergenceReplayInput = Object.freeze({
    source_value_snapshots: validSnapshots.map((snapshot) => ({
      snapshot_id: snapshot.snapshot_id,
      source_id: snapshot.source_id,
      value: snapshot.value,
      market_type: snapshot.market_type,
      timestamp: snapshot.timestamp,
      verification_status: snapshot.verification_status,
      freshness_status: snapshot.freshness_status,
    })),
    thresholds: resolvedThresholds,
    classifier_version: "consensus-divergence-classifier/v1",
    schema_version: event.schema_version,
  });

  return {
    status: "SIGNAL",
    reasons: [
      "Consensus divergence detected across verified sources.",
      `Highest value observed: ${String(measurement.highestValue)}.`,
      `Lowest value observed: ${String(measurement.lowestValue)}.`,
    ],
    evidence,
    confidence_factors: buildConfidenceFactors(evidence),
    replay_input: replayInput,
  };
}
