import type { ExecutionTreatyPackage } from "@/types/execution-treaty";
import type { GovernanceOverlay, StepTraceView } from "@/types/step-trace-viewer";
import type { PolicyDecisionExplainerError, PolicyActivationView } from "@/types/policy-decision-explainer";

export function projectPolicyActivations(input: {
  traceView: StepTraceView;
  governanceOverlay?: GovernanceOverlay;
  treaty?: ExecutionTreatyPackage;
}): { activations: readonly PolicyActivationView[]; warnings: readonly string[]; errors: readonly PolicyDecisionExplainerError[] } {
  const warnings: string[] = [];
  const errors: PolicyDecisionExplainerError[] = [];
  const governance = input.governanceOverlay ?? input.traceView.governanceOverlay;
  const treaty = input.treaty;

  if (!governance) {
    errors.push({
      code: "POLICY_ACTIVATION_MISSING",
      message: "policy activation reasoning is unavailable",
      path: "traceView.governanceOverlay",
    });
    return {
      activations: Object.freeze([Object.freeze({
        policyId: "unknown-policy",
        ruleId: "unknown-rule",
        activationOrder: 1,
        activationState: "unknown",
        activationReason: "governance reasoning unavailable",
        missingEvidence: true,
        unknownActivationState: true,
      })]),
      warnings: Object.freeze(warnings),
      errors: Object.freeze(errors),
    };
  }

  const activations: PolicyActivationView[] = [
    Object.freeze({
      policyId: governance.policyId ?? treaty?.manifest.approvalChainHash ?? "unknown-policy",
      ruleId: governance.policyId ?? treaty?.manifest.governanceSnapshotHash ?? "unknown-rule",
      activationOrder: 1,
      activationState:
        governance.decision === "passed"
          ? "activated"
          : governance.decision === "failed" || governance.decision === "denied"
            ? "not-activated"
            : "unknown",
      activationReason: governance.reason,
      evidenceHash: governance.evidenceHash,
      missingEvidence: !governance.evidenceHash,
      unknownActivationState: governance.decision !== "passed" && governance.decision !== "failed" && governance.decision !== "denied",
    }),
  ];

  if (!governance.evidenceHash) {
    warnings.push("policy activation evidence is missing");
  }

  return {
    activations: Object.freeze(activations),
    warnings: Object.freeze(warnings),
    errors: Object.freeze(errors),
  };
}
