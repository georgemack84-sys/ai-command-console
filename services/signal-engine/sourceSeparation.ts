import type { SourceMarketValueSnapshot, SourceSeparationEvidence } from "./types";

function toNumber(value: number | string): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function detectSourceSeparation(
  snapshots: SourceMarketValueSnapshot[],
): SourceSeparationEvidence | undefined {
  if (snapshots.length < 2) {
    return undefined;
  }
  const grouped = new Map<string, SourceMarketValueSnapshot[]>();
  for (const snapshot of snapshots) {
    const list = grouped.get(snapshot.source_id) ?? [];
    list.push(snapshot);
    list.sort((left, right) => left.timestamp.localeCompare(right.timestamp));
    grouped.set(snapshot.source_id, list);
  }

  for (const [sourceId, history] of [...grouped.entries()].sort((left, right) => left[0].localeCompare(right[0]))) {
    if (history.length < 2) {
      continue;
    }
    const previous = history[history.length - 2];
    const current = history[history.length - 1];
    const previousNumeric = toNumber(previous.value);
    const currentNumeric = toNumber(current.value);
    if (previousNumeric === null || currentNumeric === null || previousNumeric === currentNumeric) {
      continue;
    }

    const stationaryValues = [...grouped.entries()]
      .filter(([otherSourceId, otherHistory]) => {
        if (otherSourceId === sourceId || otherHistory.length === 0) {
          return false;
        }
        const latest = otherHistory[otherHistory.length - 1];
        const latestNumeric = toNumber(latest.value);
        return latestNumeric !== null && latestNumeric === previousNumeric;
      })
      .map(([otherSourceId, otherHistory]) => {
        const latest = otherHistory[otherHistory.length - 1];
        return {
          source_id: otherSourceId,
          value: latest.value,
          timestamp: latest.timestamp,
        };
      })
      .sort((left, right) => left.source_id.localeCompare(right.source_id));

    if (stationaryValues.length === 0) {
      continue;
    }

    return Object.freeze({
      moving_source_id: sourceId,
      stationary_source_ids: stationaryValues.map((value) => value.source_id),
      previous_value: previous.value,
      new_value: current.value,
      stationary_values: stationaryValues,
      separation_size: Number(Math.abs(currentNumeric - previousNumeric).toFixed(4)),
      timestamp: current.timestamp,
    });
  }

  return undefined;
}
