import type { PlayerPropObservation, PlayerPropSubtype } from "./marketObservationTypes";

export const recommendedPlayerPropSubtypes: ReadonlySet<PlayerPropSubtype> = new Set([
  "POINTS",
  "REBOUNDS",
  "ASSISTS",
  "THREES",
  "SAVES",
  "STRIKEOUTS",
  "TOUCHDOWNS",
]);

export function isPlayerPropObservation(observation: { market_type?: unknown }): observation is PlayerPropObservation {
  return observation.market_type === "PLAYER_PROP";
}
