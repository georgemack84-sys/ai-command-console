import type {
  ConsensusDivergenceEvidence,
  ConsensusDivergenceThresholds,
  SourceMarketValueSnapshot,
} from "./types";

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

export function getMarketThreshold(
  marketType: SourceMarketValueSnapshot["market_type"],
  thresholds: ConsensusDivergenceThresholds,
): number {
  if (marketType === "SPREAD") {
    return thresholds.spread_divergence_threshold;
  }
  if (marketType === "TOTAL") {
    return thresholds.total_divergence_threshold;
  }
  return thresholds.moneyline_divergence_threshold;
}

export function measureDivergence(
  values: SourceMarketValueSnapshot[],
  thresholds: ConsensusDivergenceThresholds,
): {
  highestValue: number | string;
  lowestValue: number | string;
  divergenceSize: number;
  divergenceState: ConsensusDivergenceEvidence["divergence_state"];
} | null {
  const numericValues = values
    .map((value) => ({ raw: value.value, numeric: toNumber(value.value) }))
    .filter((entry): entry is { raw: number | string; numeric: number } => entry.numeric !== null)
    .sort((left, right) => left.numeric - right.numeric);
  if (numericValues.length === 0) {
    return null;
  }

  const lowest = numericValues[0];
  const highest = numericValues[numericValues.length - 1];
  const divergenceSize = Number(Math.abs(highest.numeric - lowest.numeric).toFixed(4));
  const threshold = getMarketThreshold(values[0].market_type, thresholds);

  let divergenceState: ConsensusDivergenceEvidence["divergence_state"] = "NONE";
  if (divergenceSize > 0 && divergenceSize < threshold) {
    divergenceState = "MINOR";
  } else if (divergenceSize >= threshold * thresholds.severe_divergence_multiplier) {
    divergenceState = "SEVERE";
  } else if (divergenceSize >= threshold) {
    divergenceState = "MEANINGFUL";
  }

  return {
    highestValue: highest.raw,
    lowestValue: lowest.raw,
    divergenceSize,
    divergenceState,
  };
}
