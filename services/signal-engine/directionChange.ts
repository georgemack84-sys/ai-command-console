import type { DirectionChangeResult } from "./types";

export function countDirectionChanges(directions: readonly string[]): DirectionChangeResult {
  let directionChanges = 0;
  for (let index = 1; index < directions.length; index += 1) {
    if (directions[index] !== directions[index - 1]) {
      directionChanges += 1;
    }
  }

  return Object.freeze({
    direction_changes: directionChanges,
    direction_sequence: [...directions],
    back_and_forth_detected: directionChanges >= 2,
  });
}
