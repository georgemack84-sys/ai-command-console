import { hashEvidence } from "@/services/audit/evidenceHashing";
import type { GovernanceDecision, GovernanceValidationInput, PlanDraft } from "./validationContracts";

export function hashPlanDraft(plan: PlanDraft) {
  return hashEvidence({
    planId: plan.planId ?? "",
    intent: plan.intent ?? "",
    metadata: plan.metadata ?? {},
    schemaVersion: plan.schemaVersion ?? "",
    steps: plan.steps ?? [],
  });
}

export function hashGovernanceDecision(input: {
  governance?: GovernanceValidationInput;
  decision: GovernanceDecision;
  blockedReasons: string[];
  freezeReasons?: string[];
}) {
  return hashEvidence({
    governance: input.governance ?? null,
    decision: input.decision,
    blockedReasons: [...input.blockedReasons].sort(),
    freezeReasons: [...(input.freezeReasons ?? [])].sort(),
  });
}
