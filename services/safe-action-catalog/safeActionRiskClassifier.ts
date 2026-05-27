import type { SafeActionCategory, SafeActionRiskClass } from "@/types/safe-action-catalog";

const RISK_BY_CATEGORY: Readonly<Record<SafeActionCategory, SafeActionRiskClass>> = Object.freeze({
  observe: "read_only",
  recommend: "advisory",
  simulate: "simulation_only",
  escalate: "operator_escalation",
  pause_request: "operator_escalation",
  prepare_handoff: "handoff_preparation",
});

export function classifySafeActionRisk(category: SafeActionCategory | string): SafeActionRiskClass {
  return (RISK_BY_CATEGORY as Record<string, SafeActionRiskClass | undefined>)[category] ?? "forbidden";
}
