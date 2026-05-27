import type { ResilienceThresholds } from "./resilienceTypes";
import { DEFAULT_RESILIENCE_THRESHOLDS } from "./resilienceConstants";

export function getResilienceThresholds(): ResilienceThresholds {
  return { ...DEFAULT_RESILIENCE_THRESHOLDS };
}
