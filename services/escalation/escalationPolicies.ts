import type { OperationalStabilityAssessment } from "../stability/operationalStabilityEngine";
import type { EscalationPolicyDecision } from "./contracts/escalationPolicyTypes";
import type { EscalationType } from "./contracts/escalationTypes";

export function evaluateEscalationPolicy({
  requestedType,
  stabilityAssessment,
}: {
  requestedType: EscalationType;
  stabilityAssessment: OperationalStabilityAssessment;
}): EscalationPolicyDecision {
  const severe = stabilityAssessment.lockdownRecommended || stabilityAssessment.operationalState === "COLLAPSING";
  const severity =
    requestedType === "emergency" || severe ? "CATASTROPHIC"
      : requestedType === "constitutional" || requestedType === "containment" || stabilityAssessment.containmentRecommended ? "CRITICAL"
        : requestedType === "governance" || requestedType === "infrastructure" || stabilityAssessment.operationalState === "CRITICAL" ? "HIGH"
          : requestedType === "recovery" || requestedType === "operator" || stabilityAssessment.operationalState === "UNSTABLE" ? "MODERATE"
            : "LOW";

  return {
    escalationType: requestedType,
    escalationSeverity: severity,
    requiresContainment: requestedType === "containment" || requestedType === "emergency" || stabilityAssessment.containmentRecommended,
    requiresOperatorVisibility: true,
    governanceRequired: ["governance", "constitutional", "containment", "emergency"].includes(requestedType),
    emergency: requestedType === "emergency" || severity === "CATASTROPHIC",
    recommendedActions: Array.from(new Set([
      severity === "CATASTROPHIC" ? "IMMEDIATE_OPERATOR_REVIEW" : "PRIORITIZED_REVIEW",
      stabilityAssessment.stabilizationRequired ? "MAINTAIN_STABILIZATION" : "CONTINUE_MONITORING",
      stabilityAssessment.containmentRecommended ? "RETAIN_CONTAINMENT" : "NO_CONTAINMENT_RELEASE",
    ])),
  };
}
