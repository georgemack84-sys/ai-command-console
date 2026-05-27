import type { CanonicalPlan } from "../../contracts/plan-types";
import type { ValidationError } from "../validation-result";

export function runGovernancePass(plan: CanonicalPlan) {
  const errors: ValidationError[] = [];
  let approvalRequired = false;

  if (plan.mission.classification === "restricted" || plan.mission.classification === "mutating") {
    approvalRequired = true;
    if (!plan.approvals.required) {
      errors.push({
        code: "PLAN_APPROVAL_MISSING",
        path: "approvals.required",
        message: "Restricted or mutating plans must declare approvals.",
        stage: "governance",
      });
    }
  }

  if (plan.execution.mode === "approval_required" && !plan.approvals.required) {
    approvalRequired = true;
    errors.push({
      code: "PLAN_APPROVAL_MISSING",
      path: "execution.mode",
      message: "approval_required execution mode needs approvals.required.",
      stage: "approval",
    });
  }

  if (plan.governance.truthScoreRequired < 0.5) {
    errors.push({
      code: "GOVERNANCE_FAILURE",
      path: "governance.truthScoreRequired",
      message: "Governance truth score is below structural minimum.",
      stage: "governance",
    });
  }

  if (plan.steps.some((step) => step.safety.approvalRequired) && !plan.approvals.required) {
    approvalRequired = true;
    errors.push({
      code: "PLAN_APPROVAL_MISSING",
      path: "approvals.required",
      message: "Approval-required steps must declare plan approval boundaries.",
      stage: "approval",
    });
  }

  return {
    errors,
    approvalRequired,
  };
}

