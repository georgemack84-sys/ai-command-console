import type { StepTraceView } from "@/types/step-trace-viewer";
import type { PolicyDecisionExplainerError, RiskContributorView, RiskExplanationView } from "@/types/policy-decision-explainer";

function severityForStatus(status: string): RiskContributorView["severity"] {
  if (status === "denied" || status === "failed") {
    return "high";
  }
  if (status === "revalidation-required" || status === "disputed" || status === "invalid") {
    return "medium";
  }
  if (status === "passed" || status === "approved") {
    return "low";
  }
  return "unknown";
}

export function projectRiskReasoning(input: {
  traceView: StepTraceView;
}): { reasoning: RiskExplanationView; warnings: readonly string[]; errors: readonly PolicyDecisionExplainerError[] } {
  const warnings: string[] = [];
  const errors: PolicyDecisionExplainerError[] = [];
  const contributors = input.traceView.validationView.items
    .filter((item) => !item.passed || Boolean(item.failureCode))
    .map((item) => Object.freeze({
      source: item.validator,
      reason: item.failureCode ?? item.status,
      evidenceHash: item.hash,
      severity: severityForStatus(item.status),
      missingEvidence: item.evidence.length === 0,
    }));

  if (contributors.length === 0) {
    errors.push({
      code: "POLICY_RISK_REASONING_UNAVAILABLE",
      message: "risk reasoning is unavailable",
      path: "traceView.validationView.items",
    });
    return {
      reasoning: Object.freeze({
        contributors: Object.freeze([]),
        missingRiskEvidence: true,
        riskDrivenEscalation: false,
        unknownRiskState: true,
      }),
      warnings: Object.freeze(warnings),
      errors: Object.freeze(errors),
    };
  }

  const missingRiskEvidence = contributors.some((contributor) => contributor.missingEvidence);
  if (missingRiskEvidence) {
    warnings.push("missing risk evidence remains visible");
  }

  return {
    reasoning: Object.freeze({
      contributors: Object.freeze(contributors),
      thresholdEvidence: input.traceView.forensicView?.explanationHash,
      missingRiskEvidence,
      riskDrivenEscalation: contributors.some((contributor) => contributor.severity === "high" || contributor.severity === "medium"),
      unknownRiskState: false,
    }),
    warnings: Object.freeze(warnings),
    errors: Object.freeze(errors),
  };
}
