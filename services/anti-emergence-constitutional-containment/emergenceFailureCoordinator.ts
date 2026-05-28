import type {
  AntiEmergenceError,
  EmergenceClassification,
} from "./antiEmergenceStateTypes";

export function resolveEmergenceClassification(
  errors: readonly AntiEmergenceError[],
  hasTriggeredSignals: boolean,
): EmergenceClassification {
  const codes = errors.map((item) => item.code);
  if (codes.some((code) => code === "ANTI_EMERGENCE_ISOLATION_VIOLATION" || code === "ANTI_EMERGENCE_BOUNDARY_VIOLATION")) {
    return "invalid";
  }
  if (codes.some((code) => code === "ANTI_EMERGENCE_GOVERNANCE_DETACHED" || code === "ANTI_EMERGENCE_REPLAY_MISMATCH")) {
    return "disputed";
  }
  if (codes.some((code) => code === "ANTI_EMERGENCE_CONTAINMENT_DRIFT" || code === "ANTI_EMERGENCE_DRIFT_DETECTED")) {
    return "frozen";
  }
  if (codes.some((code) => code === "ANTI_EMERGENCE_SUPREMACY_VIOLATION")) {
    return "revoked";
  }
  if (errors.length > 0 || hasTriggeredSignals) {
    return "elevated";
  }
  return "contained";
}
