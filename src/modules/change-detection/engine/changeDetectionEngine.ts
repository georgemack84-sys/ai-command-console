import { isNonEmptyString } from "../../../core";
import type { MarketObservation, MarketType } from "../../markets";
import { compareAlternateLineMovement } from "../comparators/alternateLineMovementComparator";
import { compareMoneylineMovement } from "../comparators/moneylineMovementComparator";
import { compareNumericMovement } from "../comparators/oddsMovementComparator";
import { comparePlayerPropMovement } from "../comparators/playerPropMovementComparator";
import { compareSpreadMovement } from "../comparators/spreadMovementComparator";
import { compareTotalsMovement } from "../comparators/totalsMovementComparator";
import { createChangeDetectionEvent } from "../events/changeDetectionEvents";
import { createMarketComparisonKey } from "../keys/marketComparisonKey";
import type { ChangeDetectionFailure, ChangeDetectionFailureReason } from "../records/changeDetectionFailure";
import type { ChangeDetectionEvent, MarketChangeRecord } from "../records/marketChangeRecord";

const validMarketTypes = new Set<MarketType>(["SPREAD", "MONEYLINE", "TOTALS", "PLAYER_PROP", "ALTERNATE_LINE"]);

function changeId(previous: Partial<MarketObservation> | undefined, next: Partial<MarketObservation>, version: string) {
  return `change_${next.source_id ?? "unknown"}_${next.market_id ?? "unknown"}_${previous?.timestamp ?? "baseline"}_${next.timestamp ?? "unknown"}_${version}`.replace(/[^a-zA-Z0-9_]/g, "_");
}

function failure(input: {
  previous?: Partial<MarketObservation>;
  next: Partial<MarketObservation>;
  reason: ChangeDetectionFailureReason;
  version: string;
}): { status: "NO_BASELINE" | "COMPARISON_FAILED"; failure: ChangeDetectionFailure; events: ChangeDetectionEvent[] } {
  const id = changeId(input.previous, input.next, input.version);
  const timestamp = typeof input.next.timestamp === "string" ? input.next.timestamp : new Date(0).toISOString();
  const failureRecord: ChangeDetectionFailure = {
    failure_id: `failure_${id}_${input.reason}`,
    market_id: typeof input.next.market_id === "string" ? input.next.market_id : "unknown_market",
    source_id: typeof input.next.source_id === "string" ? input.next.source_id : "unknown_source",
    reason: input.reason,
    timestamp,
    version: input.version,
  };

  return {
    status: input.reason === "NO_PREVIOUS_OBSERVATION" ? "NO_BASELINE" : "COMPARISON_FAILED",
    failure: failureRecord,
    events: [
      createChangeDetectionEvent({
        change_id: id,
        market_id: failureRecord.market_id,
        source_id: failureRecord.source_id,
        event_type: input.reason === "NO_PREVIOUS_OBSERVATION" ? "NO_BASELINE_FOUND" : "CHANGE_COMPARISON_FAILED",
        severity: "WARN",
        reason: input.reason,
        timestamp,
        version: input.version,
      }),
      createChangeDetectionEvent({
        change_id: id,
        market_id: failureRecord.market_id,
        source_id: failureRecord.source_id,
        event_type: "CHANGE_FAILURE_RECORDED",
        severity: "WARN",
        reason: input.reason,
        timestamp,
        version: input.version,
      }),
    ],
  };
}

export function detectMarketChange(input: {
  previous?: Partial<MarketObservation>;
  next: Partial<MarketObservation>;
  compareOddsOnly?: boolean;
  version?: string;
}):
  | { status: "CHANGE_DETECTED" | "NO_CHANGE"; change: MarketChangeRecord; events: ChangeDetectionEvent[] }
  | { status: "NO_BASELINE" | "COMPARISON_FAILED"; failure: ChangeDetectionFailure; events: ChangeDetectionEvent[] } {
  const version = input.version ?? "1.6";
  const id = changeId(input.previous, input.next, version);
  const started = createChangeDetectionEvent({
    change_id: id,
    market_id: input.next.market_id,
    source_id: input.next.source_id,
    event_type: "CHANGE_DETECTION_STARTED",
    reason: "Change detection started.",
    timestamp: input.next.timestamp,
    version,
  });

  if (!isNonEmptyString(input.next.source_id)) return failure({ ...input, reason: "MISSING_SOURCE_ID", version });
  if (!isNonEmptyString(input.next.market_id)) return failure({ ...input, reason: "MISSING_MARKET_ID", version });
  if (!isNonEmptyString(input.next.ownership_hash)) return failure({ ...input, reason: "MISSING_OWNERSHIP_HASH", version });
  if (!input.next.market_type || !validMarketTypes.has(input.next.market_type as MarketType)) {
    return failure({ ...input, reason: "INVALID_MARKET_TYPE", version });
  }
  if (!input.previous) return failure({ ...input, reason: "NO_PREVIOUS_OBSERVATION", version });

  const previousKey = createMarketComparisonKey(input.previous);
  const nextKey = createMarketComparisonKey(input.next);
  if (previousKey.status === "FAILED" || nextKey.status === "FAILED" || previousKey.key !== nextKey.key) {
    return failure({ ...input, reason: "COMPARISON_NOT_ALLOWED", version });
  }

  const comparison =
    input.compareOddsOnly ? compareNumericMovement(input.previous.odds_value, input.next.odds_value) :
    input.next.market_type === "SPREAD" ? compareSpreadMovement(input.previous, input.next) :
    input.next.market_type === "MONEYLINE" ? compareMoneylineMovement(input.previous, input.next) :
    input.next.market_type === "TOTALS" ? compareTotalsMovement(input.previous, input.next) :
    input.next.market_type === "PLAYER_PROP" ? comparePlayerPropMovement(input.previous, input.next) :
    input.next.market_type === "ALTERNATE_LINE" ? compareAlternateLineMovement(input.previous, input.next) :
    { status: "FAILED" as const, reason: "INVALID_MARKET_TYPE" as const };

  if (comparison.status === "FAILED") {
    return failure({ ...input, reason: comparison.reason, version });
  }

  const timestamp = input.next.timestamp ?? new Date(0).toISOString();
  const change: MarketChangeRecord = {
    change_id: id,
    market_id: input.next.market_id,
    source_id: input.next.source_id,
    ownership_hash: input.next.ownership_hash,
    market_type: input.next.market_type,
    previous_value: comparison.previous_value,
    new_value: comparison.new_value,
    movement_size: comparison.movement_size,
    movement_direction: comparison.movement_direction,
    timestamp,
    version,
  };

  return {
    status: comparison.status,
    change,
    events: [
      started,
      createChangeDetectionEvent({ change_id: id, market_id: change.market_id, source_id: change.source_id, event_type: "BASELINE_FOUND", reason: "Baseline found.", timestamp, version }),
      createChangeDetectionEvent({
        change_id: id,
        market_id: change.market_id,
        source_id: change.source_id,
        event_type: comparison.status === "CHANGE_DETECTED" ? "MARKET_CHANGE_DETECTED" : "NO_MARKET_CHANGE",
        reason: comparison.status === "CHANGE_DETECTED" ? "Market movement detected." : "No market change.",
        timestamp,
        version,
      }),
      createChangeDetectionEvent({ change_id: id, market_id: change.market_id, source_id: change.source_id, event_type: "CHANGE_RECORD_CREATED", reason: "Change record created.", timestamp, version }),
    ],
  };
}
