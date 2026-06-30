import type { MovementDirection } from "../records/marketChangeRecord";

export function calculateMovementDirection(previousValue: number | null, newValue: number | null): MovementDirection {
  if (previousValue === null || newValue === null) return "UNKNOWN";
  if (newValue > previousValue) return "UP";
  if (newValue < previousValue) return "DOWN";
  return "UNCHANGED";
}

export function calculateMovementSize(previousValue: number | null, newValue: number | null): number | null {
  if (previousValue === null || newValue === null) return null;
  return Math.abs(newValue - previousValue);
}

export function compareNumericMovement(previousValue: unknown, newValue: unknown) {
  if (typeof previousValue !== "number" || !Number.isFinite(previousValue)) {
    return { status: "FAILED" as const, reason: "MISSING_PREVIOUS_VALUE" as const };
  }

  if (typeof newValue !== "number" || !Number.isFinite(newValue)) {
    return { status: "FAILED" as const, reason: "MISSING_NEW_VALUE" as const };
  }

  const movementSize = calculateMovementSize(previousValue, newValue);
  const movementDirection = calculateMovementDirection(previousValue, newValue);

  return {
    status: previousValue === newValue ? "NO_CHANGE" as const : "CHANGE_DETECTED" as const,
    previous_value: previousValue,
    new_value: newValue,
    movement_size: movementSize,
    movement_direction: movementDirection,
  };
}
