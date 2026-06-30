import { countDirectionChanges } from "./directionChange";
import { calculateMovementFrequency } from "./movementFrequency";
import { resolveVolatilitySpikeThresholds } from "./volatilitySpikeThresholds";
import { classifyVolatilityState } from "./volatilityState";
import type {
  MovementHistoryWindow,
  VolatilitySpikeConfidenceFactors,
  VolatilitySpikeEvidence,
  VolatilitySpikeReplayInput,
  VolatilitySpikeSignalEvaluation,
  VolatilitySpikeThresholds,
  VerifiedMovementEvent,
} from "./types";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseMovementHistoryWindow(value: unknown): MovementHistoryWindow | null {
  if (!isObject(value) || !Array.isArray(value.events)) {
    return null;
  }
  const window: MovementHistoryWindow = {
    market_id: String(value.market_id ?? ""),
    market_type: value.market_type as MovementHistoryWindow["market_type"],
    events: value.events
      .map((event) => ({
        event_id: String((event as Record<string, unknown>).event_id ?? ""),
        source_id: String((event as Record<string, unknown>).source_id ?? ""),
        previous_value: (event as Record<string, unknown>).previous_value as number | string,
        new_value: (event as Record<string, unknown>).new_value as number | string,
        movement_size: Number((event as Record<string, unknown>).movement_size),
        movement_direction: String((event as Record<string, unknown>).movement_direction ?? ""),
        timestamp: String((event as Record<string, unknown>).timestamp ?? ""),
        verification_status: (event as Record<string, unknown>).verification_status as "VERIFIED" | "LIMITED" | "INVALID",
      }))
      .sort((left, right) => {
        if (left.timestamp !== right.timestamp) {
          return left.timestamp.localeCompare(right.timestamp);
        }
        return left.event_id.localeCompare(right.event_id);
      }),
    window_start: String(value.window_start ?? ""),
    window_end: String(value.window_end ?? ""),
    schema_version: String(value.schema_version ?? ""),
  };

  if (!window.market_id || !window.window_start || !window.window_end || !window.schema_version) {
    return null;
  }
  if (!["SPREAD", "TOTAL", "MONEYLINE", "PROP", "UNKNOWN"].includes(window.market_type)) {
    return null;
  }
  if (
    window.events.some((event) =>
      !event.event_id
      || !event.source_id
      || !event.timestamp
      || !event.movement_direction
      || !Number.isFinite(event.movement_size)
      || (typeof event.previous_value !== "number" && typeof event.previous_value !== "string")
      || (typeof event.new_value !== "number" && typeof event.new_value !== "string")
      || !["VERIFIED", "LIMITED", "INVALID"].includes(event.verification_status))
  ) {
    return null;
  }
  return Object.freeze(window);
}

function buildConfidenceFactors(evidence: VolatilitySpikeEvidence): VolatilitySpikeConfidenceFactors {
  return Object.freeze({
    movement_count: evidence.movement_count,
    largest_change: evidence.largest_change.movement_size,
    direction_changes: evidence.direction_changes,
    movements_per_minute: evidence.frequency_metrics.movements_per_minute,
    source_count: evidence.source_count,
    evidence_completeness: true,
  });
}

export function evaluateVolatilitySpikeSignal(
  event: VerifiedMovementEvent,
  thresholds: Partial<VolatilitySpikeThresholds> = {},
): VolatilitySpikeSignalEvaluation {
  if (event.verification_status !== "VERIFIED") {
    return {
      status: "REJECTED",
      reasons: ["Only verified movement events may produce a volatility spike signal."],
      rejection_code: "EVENT_NOT_VERIFIED",
    };
  }

  const movementHistoryWindow = parseMovementHistoryWindow(event.payload.movement_history_window);
  if (!movementHistoryWindow) {
    return {
      status: "REJECTED",
      reasons: ["Movement history window is required for volatility spike detection."],
      rejection_code: "MISSING_EVIDENCE",
    };
  }
  if (movementHistoryWindow.market_id !== event.market_id) {
    return {
      status: "REJECTED",
      reasons: ["Movement history events must belong to the same market."],
      rejection_code: "MISSING_EVIDENCE",
    };
  }

  const validEvents = movementHistoryWindow.events.filter((movementEvent) => movementEvent.verification_status !== "INVALID");
  if (validEvents.length !== movementHistoryWindow.events.length || validEvents.length === 0) {
    return {
      status: "REJECTED",
      reasons: ["Invalid movement events cannot create a volatility spike signal."],
      rejection_code: "MISSING_EVIDENCE",
    };
  }

  const resolvedThresholds = resolveVolatilitySpikeThresholds(thresholds);
  if (validEvents.length < resolvedThresholds.minimum_movement_count) {
    return {
      status: "NO_SIGNAL",
      reasons: ["Minimum movement count was not met."],
    };
  }

  const windowStart = Date.parse(movementHistoryWindow.window_start);
  const windowEnd = Date.parse(movementHistoryWindow.window_end);
  if (Number.isNaN(windowStart) || Number.isNaN(windowEnd)) {
    return {
      status: "REJECTED",
      reasons: ["Movement history window timing is invalid."],
      rejection_code: "MISSING_EVIDENCE",
    };
  }
  const durationSeconds = Math.max(0, Math.round((windowEnd - windowStart) / 1000));
  if (durationSeconds > resolvedThresholds.maximum_time_window_seconds) {
    return {
      status: "NO_SIGNAL",
      reasons: ["Movement occurred outside the configured volatility window."],
    };
  }

  const largestChange = [...validEvents].sort((left, right) => {
    if (right.movement_size !== left.movement_size) {
      return right.movement_size - left.movement_size;
    }
    return left.event_id.localeCompare(right.event_id);
  })[0];
  const directionChangeResult = countDirectionChanges(validEvents.map((movementEvent) => movementEvent.movement_direction));
  const frequencyMetrics = calculateMovementFrequency(validEvents.length, durationSeconds);
  const volatilityState = classifyVolatilityState(
    validEvents.length,
    largestChange.movement_size,
    directionChangeResult.direction_changes,
    frequencyMetrics.movements_per_minute,
    directionChangeResult.back_and_forth_detected,
    resolvedThresholds,
  );

  if (
    largestChange.movement_size < resolvedThresholds.minimum_largest_change
    && frequencyMetrics.movements_per_minute < resolvedThresholds.minimum_movements_per_minute
    && directionChangeResult.direction_changes < resolvedThresholds.minimum_direction_changes
  ) {
    return {
      status: "NO_SIGNAL",
      reasons: ["Largest change, movement frequency, and direction-change thresholds were not met."],
    };
  }
  if (volatilityState !== "SPIKE" && volatilityState !== "SEVERE_SPIKE") {
    return {
      status: "NO_SIGNAL",
      reasons: ["Volatility activity was elevated but did not reach spike threshold."],
    };
  }

  const evidence: VolatilitySpikeEvidence = Object.freeze({
    movement_count: validEvents.length,
    movement_sequence: validEvents.map((movementEvent) => ({
      event_id: movementEvent.event_id,
      source_id: movementEvent.source_id,
      previous_value: movementEvent.previous_value,
      new_value: movementEvent.new_value,
      movement_size: movementEvent.movement_size,
      movement_direction: movementEvent.movement_direction,
      timestamp: movementEvent.timestamp,
    })),
    largest_change: {
      event_id: largestChange.event_id,
      movement_size: largestChange.movement_size,
      previous_value: largestChange.previous_value,
      new_value: largestChange.new_value,
      timestamp: largestChange.timestamp,
    },
    direction_changes: directionChangeResult.direction_changes,
    time_window: {
      start_timestamp: movementHistoryWindow.window_start,
      end_timestamp: movementHistoryWindow.window_end,
      duration_seconds: durationSeconds,
    },
    source_ids: [...new Set(validEvents.map((movementEvent) => movementEvent.source_id))].sort(),
    source_count: new Set(validEvents.map((movementEvent) => movementEvent.source_id)).size,
    timestamp: event.timestamp,
    volatility_state: volatilityState,
    frequency_metrics: frequencyMetrics,
  });

  const replayInput: VolatilitySpikeReplayInput = Object.freeze({
    movement_history_window: movementHistoryWindow,
    thresholds: resolvedThresholds,
    classifier_version: "volatility-spike-classifier/v1",
    schema_version: event.schema_version,
  });

  return {
    status: "SIGNAL",
    reasons: [
      `The market recorded ${evidence.movement_count} movement(s) inside the configured window.`,
      `Largest movement measured ${evidence.largest_change.movement_size}.`,
      `Movement frequency reached ${evidence.frequency_metrics.movements_per_minute} movement(s) per minute.`,
    ],
    evidence,
    confidence_factors: buildConfidenceFactors(evidence),
    replay_input: replayInput,
  };
}
