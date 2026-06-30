import type { MarketSideStrengthResult, VerifiedMovementEvent } from "./types";

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function readLineValue(payload: Record<string, unknown>, key: "previous_line" | "new_line", fallbackKey: "previous_values" | "new_values"): number | string | null {
  const directValue = payload[key];
  if (typeof directValue === "number" || typeof directValue === "string") {
    return directValue;
  }
  const observations = payload[fallbackKey];
  if (!Array.isArray(observations) || observations.length === 0) {
    return null;
  }
  const first = observations[0];
  if (typeof first !== "object" || first === null || !("value" in first)) {
    return null;
  }
  const value = (first as { value: unknown }).value;
  return typeof value === "number" || typeof value === "string" ? value : null;
}

export function calculateMarketSideStrength(event: VerifiedMovementEvent): MarketSideStrengthResult | null {
  const payload = event.payload;
  const previousLine = readLineValue(payload, "previous_line", "previous_values");
  const newLine = readLineValue(payload, "new_line", "new_values");
  if (previousLine === null || newLine === null) {
    return null;
  }

  const previousNumber = toNumber(previousLine);
  const newNumber = toNumber(newLine);
  if (previousNumber === null || newNumber === null || previousNumber === newNumber) {
    return null;
  }

  const movementSize = Number(Math.abs(newNumber - previousNumber).toFixed(4));
  const sideMap = (typeof payload.market_side_map === "object" && payload.market_side_map !== null
    ? payload.market_side_map
    : {}) as Record<string, unknown>;

  if (event.event_type === "spread_movement_event") {
    const favoriteSide = typeof sideMap.favorite_side === "string" ? sideMap.favorite_side : "favorite";
    const underdogSide = typeof sideMap.underdog_side === "string" ? sideMap.underdog_side : "underdog";
    return Object.freeze({
      market_side_strengthened: newNumber < previousNumber ? favoriteSide : underdogSide,
      movement_direction: newNumber < previousNumber ? "TOWARD_FAVORITE" : "TOWARD_UNDERDOG",
      explanation: newNumber < previousNumber ? "Favorite strengthened." : "Underdog strengthened.",
      movement_size: movementSize,
      previous_line: previousLine,
      new_line: newLine,
    });
  }

  if (event.event_type === "totals_movement_event") {
    const overSide = typeof sideMap.over_side === "string" ? sideMap.over_side : "Over";
    const underSide = typeof sideMap.under_side === "string" ? sideMap.under_side : "Under";
    return Object.freeze({
      market_side_strengthened: newNumber > previousNumber ? overSide : underSide,
      movement_direction: newNumber > previousNumber ? "TOWARD_OVER" : "TOWARD_UNDER",
      explanation: newNumber > previousNumber ? "Over strengthened." : "Under strengthened.",
      movement_size: movementSize,
      previous_line: previousLine,
      new_line: newLine,
    });
  }

  if (event.event_type === "moneyline_movement_event" || event.event_type === "odds_shift_event") {
    const listedSide = typeof sideMap.listed_side === "string" ? sideMap.listed_side : "listed side";
    const opposingSide = typeof sideMap.opposing_side === "string" ? sideMap.opposing_side : "opposing side";
    const previousImplied = previousNumber < 0 ? Math.abs(previousNumber) / (Math.abs(previousNumber) + 100) : 100 / (previousNumber + 100);
    const newImplied = newNumber < 0 ? Math.abs(newNumber) / (Math.abs(newNumber) + 100) : 100 / (newNumber + 100);
    const listedStrengthened = newImplied > previousImplied;
    return Object.freeze({
      market_side_strengthened: listedStrengthened ? listedSide : opposingSide,
      movement_direction: listedStrengthened ? "PRICE_SHORTENING" : "PRICE_LENGTHENING",
      explanation: listedStrengthened ? "Listed side strengthened." : "Listed side weakened and the opposing side strengthened.",
      movement_size: movementSize,
      previous_line: previousLine,
      new_line: newLine,
    });
  }

  return null;
}
