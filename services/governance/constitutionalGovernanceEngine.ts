import { detectConstitutionalViolations } from "./constitutionalViolations";
import { evaluateGovernanceEscalation } from "./governanceEscalation";
import type { ConstitutionalGovernanceResult } from "./governanceArbitration";
import { CONSTITUTIONAL_POLICY_REGISTRY, type ConstitutionalState } from "./constitutionalPolicyRegistry";

function determineState(input: {
  constitutionalAction?: string;
  violations: string[];
  validationBlockedReasons: string[];
  readinessState?: string;
}) : ConstitutionalState {
  if (input.violations.includes("disputed_truth_detected")) return "DENIED";
  if (input.validationBlockedReasons.includes("governance_outage_detected")) return "EMERGENCY_GOVERNANCE";
  if (input.constitutionalAction === "DENY") return "DENIED";
  if (input.constitutionalAction === "FREEZE") return "LOCKED";
  if (input.constitutionalAction === "CONTAIN") return "CONTAINED";
  if (input.constitutionalAction === "ESCALATE") return "ESCALATED";
  if (input.validationBlockedReasons.includes("containment_verification_failed")) return "CONTAINED";
  if (input.readinessState === "CONSTITUTIONALLY_BLOCKED") return "LOCKED";
  if (input.readinessState === "DISPUTED") return "DISPUTED";
  if (input.readinessState === "GOVERNANCE_REVIEW_REQUIRED") return "RESTRICTED";
  return "CONSTITUTIONAL";
}

export function evaluateConstitutionalGovernance(input: {
  constitutionalAction?: string;
  constitutionalViolations?: string[];
  validation?: {
    valid: boolean;
    freezeActivated?: boolean;
    containmentActivated?: boolean;
    blockedReasons?: string[];
  };
  readiness?: {
    readinessState?: string;
    readinessScore?: number;
    requiresOperatorApproval?: boolean;
  };
  operatorApprovalVerified?: boolean;
}): ConstitutionalGovernanceResult {
  const violations = detectConstitutionalViolations({
    constitutionalViolations: input.constitutionalViolations,
    validationBlockedReasons: input.validation?.blockedReasons,
    disputedTruth: (input.constitutionalViolations || []).includes("disputed_truth_blocks_recovery"),
    containmentFailed: input.validation?.containmentActivated && (input.validation?.valid === false),
  });

  const constitutionalState = determineState({
    constitutionalAction: input.constitutionalAction,
    violations,
    validationBlockedReasons: input.validation?.blockedReasons || [],
    readinessState: input.readiness?.readinessState,
  });

  const governanceConfidence = Math.max(
    0.05,
    Math.min(
      1,
      ((input.readiness?.readinessScore ?? 0) / 100)
        - ((input.validation?.valid === false) ? 0.35 : 0)
        - (violations.length ? 0.15 : 0),
    ),
  );
  const escalation = evaluateGovernanceEscalation({
    constitutionalState,
    violations,
    governanceConfidence,
  });
  const containmentRequired = constitutionalState === "CONTAINED"
    || Boolean(input.validation?.containmentActivated)
    || violations.includes("containment_verification_failed");
  const requiredApprovals = Array.from(new Set([
    ...CONSTITUTIONAL_POLICY_REGISTRY[constitutionalState].requiredApprovals,
    ...(input.readiness?.requiresOperatorApproval ? ["operator_approval_required"] : []),
    ...(!input.operatorApprovalVerified ? ["operator_approval_unverified"] : []),
  ]));

  const allowed = CONSTITUTIONAL_POLICY_REGISTRY[constitutionalState].allow
    && input.validation?.valid !== false
    && input.operatorApprovalVerified !== false;

  return {
    allowed,
    constitutionalState,
    violations,
    requiredApprovals,
    escalationRequired: escalation.escalationRequired,
    containmentRequired,
    governanceConfidence,
    reasoning: Array.from(new Set([
      ...escalation.reasoning,
      ...(allowed ? ["constitutional_governance_permits_supervision"] : ["constitutional_governance_blocks_operation"]),
    ])),
  };
}
