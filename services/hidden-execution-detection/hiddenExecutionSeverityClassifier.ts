import { HIDDEN_EXECUTION_POLICY } from "./hiddenExecutionPolicy";
import type { HiddenExecutionFinding, HiddenExecutionSeverity } from "./types/hiddenExecutionDetectionTypes";

export function classifyHiddenExecutionSeverity(findings: readonly HiddenExecutionFinding[]): HiddenExecutionSeverity {
  if (findings.length === 0) {
    return "none";
  }
  if (findings.some((finding) => HIDDEN_EXECUTION_POLICY.criticalVectors.includes(finding.vector))) {
    return "critical";
  }
  if (findings.some((finding) => finding.severity === "high")) {
    return "high";
  }
  if (findings.some((finding) => finding.severity === "medium")) {
    return "medium";
  }
  return "low";
}
