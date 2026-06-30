import type {
  SourceAlignment,
  SteamConfidenceFactors,
  SteamMovementDirection,
  SteamMovementEvidence,
  SteamMovementThresholds,
  SteamReplayInput,
  SteamSignalEvaluation,
  SteamValueObservation,
  VerifiedMovementEvent,
} from "./types";
import { measureMovementSpeed } from "./movementSpeed";
import { summarizeSourceAlignment } from "./sourceAlignment";
import { resolveSteamMovementThresholds } from "./steamMovementThresholds";

const SUPPORTED_EVENT_TYPES = new Set([
  "market_movement_event",
  "spread_movement_event",
  "totals_movement_event",
  "moneyline_movement_event",
  "odds_shift_event",
] as const);

function round(value: number): number {
  return Number(value.toFixed(4));
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNumeric(value: number | string): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeObservation(value: unknown): SteamValueObservation | null {
  if (!isObject(value)) {
    return null;
  }
  const sourceId = value.source_id;
  const timestamp = value.timestamp;
  const observationValue = value.value;
  if (typeof sourceId !== "string" || sourceId.trim().length === 0) {
    return null;
  }
  if (typeof timestamp !== "string" || timestamp.trim().length === 0) {
    return null;
  }
  if (typeof observationValue !== "number" && typeof observationValue !== "string") {
    return null;
  }
  return Object.freeze({
    source_id: sourceId,
    value: observationValue,
    timestamp,
  });
}

function normalizeObservationArray(value: unknown): SteamValueObservation[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const observations = value.map(normalizeObservation);
  if (observations.some((entry) => entry === null)) {
    return null;
  }
  return (observations as SteamValueObservation[]).sort((left, right) => {
    if (left.source_id !== right.source_id) {
      return left.source_id.localeCompare(right.source_id);
    }
    if (left.timestamp !== right.timestamp) {
      return left.timestamp.localeCompare(right.timestamp);
    }
    return String(left.value).localeCompare(String(right.value));
  });
}

function isMoneylineEvent(event: VerifiedMovementEvent): boolean {
  if (event.event_type === "moneyline_movement_event") {
    return true;
  }
  const marketType = event.payload.market_type;
  return marketType === "moneyline";
}

function deriveMoneylineDirection(previousValue: number, newValue: number): SteamMovementDirection | null {
  const previousImpliedProbability =
    previousValue < 0 ? Math.abs(previousValue) / (Math.abs(previousValue) + 100) : 100 / (previousValue + 100);
  const newImpliedProbability =
    newValue < 0 ? Math.abs(newValue) / (Math.abs(newValue) + 100) : 100 / (newValue + 100);

  if (newImpliedProbability === previousImpliedProbability) {
    return null;
  }
  return newImpliedProbability > previousImpliedProbability ? "SHORTENING" : "LENGTHENING";
}

function deriveMovementDirection(
  event: VerifiedMovementEvent,
  previousValue: number,
  newValue: number,
): SteamMovementDirection | null {
  if (previousValue === newValue) {
    return null;
  }

  if (event.event_type === "spread_movement_event") {
    return newValue < previousValue ? "TOWARD_FAVORITE" : "TOWARD_UNDERDOG";
  }
  if (event.event_type === "totals_movement_event") {
    return newValue > previousValue ? "OVER" : "UNDER";
  }
  if (isMoneylineEvent(event) || event.event_type === "odds_shift_event") {
    return deriveMoneylineDirection(previousValue, newValue);
  }
  return newValue > previousValue ? "UP" : "DOWN";
}

function collectTimestamps(previousValues: SteamValueObservation[], newValues: SteamValueObservation[]): string[] {
  return [...new Set([...previousValues, ...newValues].map((value) => value.timestamp))].sort();
}

function pairObservations(
  previousValues: SteamValueObservation[],
  newValues: SteamValueObservation[],
): Array<{ previousValue: SteamValueObservation; newValue: SteamValueObservation }> {
  const newValueBySource = new Map(newValues.map((value) => [value.source_id, value]));
  return previousValues
    .map((previousValue) => {
      const newValue = newValueBySource.get(previousValue.source_id);
      if (!newValue) {
        return null;
      }
      return { previousValue, newValue };
    })
    .filter((value): value is { previousValue: SteamValueObservation; newValue: SteamValueObservation } => value !== null)
    .sort((left, right) => left.previousValue.source_id.localeCompare(right.previousValue.source_id));
}

function buildSourceAlignments(
  event: VerifiedMovementEvent,
  previousValues: SteamValueObservation[],
  newValues: SteamValueObservation[],
): {
  alignments: Omit<SourceAlignment, "aligned">[];
  movementSize: number;
} | null {
  const pairedObservations = pairObservations(previousValues, newValues);
  if (pairedObservations.length === 0) {
    return null;
  }

  const alignments: Omit<SourceAlignment, "aligned">[] = [];
  const movementSizes: number[] = [];

  for (const pair of pairedObservations) {
    const previousNumeric = toNumeric(pair.previousValue.value);
    const newNumeric = toNumeric(pair.newValue.value);
    if (previousNumeric === null || newNumeric === null) {
      return null;
    }
    const movementDirection = deriveMovementDirection(event, previousNumeric, newNumeric);
    if (!movementDirection) {
      continue;
    }
    alignments.push(
      Object.freeze({
        source_id: pair.previousValue.source_id,
        previous_value: pair.previousValue.value,
        new_value: pair.newValue.value,
        movement_direction: movementDirection,
        timestamp: pair.newValue.timestamp,
      }),
    );
    movementSizes.push(Math.abs(newNumeric - previousNumeric));
  }

  if (alignments.length === 0) {
    return null;
  }

  const averageMovementSize = movementSizes.reduce((sum, size) => sum + size, 0) / movementSizes.length;
  return {
    alignments,
    movementSize: round(averageMovementSize),
  };
}

function buildTimeWindow(timestamps: string[]): SteamMovementEvidence["time_window"] | null {
  if (timestamps.length === 0) {
    return null;
  }
  const orderedTimes = timestamps
    .map((timestamp) => ({ timestamp, epoch: Date.parse(timestamp) }))
    .sort((left, right) => left.epoch - right.epoch);
  if (orderedTimes.some((entry) => Number.isNaN(entry.epoch))) {
    return null;
  }
  const start = orderedTimes[0];
  const end = orderedTimes[orderedTimes.length - 1];
  return Object.freeze({
    start_timestamp: start.timestamp,
    end_timestamp: end.timestamp,
    duration_seconds: Math.max(0, Math.round((end.epoch - start.epoch) / 1000)),
  });
}

function buildConfidenceFactors(
  evidence: SteamMovementEvidence,
): SteamConfidenceFactors {
  return Object.freeze({
    source_count: evidence.source_count,
    alignment_ratio: evidence.source_alignment.alignment_ratio,
    movement_size: evidence.movement_size,
    movement_speed_state: evidence.movement_speed.speed_state,
    evidence_completeness: true,
  });
}

export function evaluateSteamMovementSignal(
  event: VerifiedMovementEvent,
  thresholds: Partial<SteamMovementThresholds> = {},
): SteamSignalEvaluation {
  if (event.verification_status !== "VERIFIED") {
    return {
      status: "REJECTED",
      reasons: ["Only verified movement events may produce a steam movement signal."],
      rejection_code: "EVENT_NOT_VERIFIED",
    };
  }

  if (!SUPPORTED_EVENT_TYPES.has(event.event_type)) {
    return {
      status: "NO_SIGNAL",
      reasons: ["Event type is not eligible for steam movement detection."],
    };
  }

  const resolvedThresholds = resolveSteamMovementThresholds(thresholds);
  const previousValues = normalizeObservationArray(event.payload.previous_values);
  const newValues = normalizeObservationArray(event.payload.new_values);
  if (!previousValues || !newValues || previousValues.length === 0 || newValues.length === 0) {
    return {
      status: "REJECTED",
      reasons: ["Steam movement requires previous and new source values."],
      rejection_code: "MISSING_EVIDENCE",
    };
  }

  const alignmentData = buildSourceAlignments(event, previousValues, newValues);
  if (!alignmentData) {
    return {
      status: "REJECTED",
      reasons: ["Steam movement direction could not be derived from the verified source values."],
      rejection_code: "MISSING_EVIDENCE",
    };
  }

  const alignmentSummary = summarizeSourceAlignment(alignmentData.alignments);
  const timestamps = collectTimestamps(previousValues, newValues);
  const timeWindow = buildTimeWindow(timestamps);
  if (!timeWindow) {
    return {
      status: "REJECTED",
      reasons: ["Steam movement timestamps are missing or invalid."],
      rejection_code: "MISSING_EVIDENCE",
    };
  }

  const movementSpeed = measureMovementSpeed(alignmentData.movementSize, timeWindow.duration_seconds, resolvedThresholds);
  const evidence: SteamMovementEvidence = Object.freeze({
    previous_values: previousValues,
    new_values: newValues,
    source_count: alignmentSummary.total_source_count,
    movement_direction: alignmentSummary.majority_direction,
    movement_size: alignmentData.movementSize,
    time_window: timeWindow,
    timestamps,
    movement_speed: movementSpeed,
    source_alignment: alignmentSummary,
  });

  if (alignmentSummary.total_source_count < resolvedThresholds.minimum_source_count) {
    return {
      status: "NO_SIGNAL",
      reasons: ["Steam movement requires multiple verified sources."],
    };
  }
  if (evidence.movement_size < resolvedThresholds.minimum_movement_size) {
    return {
      status: "NO_SIGNAL",
      reasons: ["Movement size did not meet the steam threshold."],
    };
  }
  if (evidence.time_window.duration_seconds > resolvedThresholds.maximum_time_window_seconds) {
    return {
      status: "NO_SIGNAL",
      reasons: ["Movement occurred outside the configured steam time window."],
    };
  }
  if (evidence.source_alignment.alignment_ratio < resolvedThresholds.minimum_alignment_ratio) {
    return {
      status: "NO_SIGNAL",
      reasons: ["Verified sources did not align strongly enough for steam detection."],
    };
  }
  if (evidence.movement_speed.speed_state === "SLOW") {
    return {
      status: "NO_SIGNAL",
      reasons: ["Movement speed did not reach the steam threshold."],
    };
  }

  const replayInput: SteamReplayInput = Object.freeze({
    movement_events: [...event.evidence.movement_events_used].sort(),
    source_values: {
      previous_values: previousValues,
      new_values: newValues,
    },
    timestamps,
    thresholds: resolvedThresholds,
    classifier_version: "steam-movement-classifier/v1",
    schema_version: event.schema_version,
  });

  return {
    status: "SIGNAL",
    reasons: [
      "Market pressure detected from fast directional movement.",
      "Multiple verified sources moved in the same direction.",
      `Movement speed classified as ${evidence.movement_speed.speed_state.toLowerCase()}.`,
    ],
    evidence,
    confidence_factors: buildConfidenceFactors(evidence),
    replay_input: replayInput,
  };
}
