import type { SafeActionProfile } from "@/types/safe-action-catalog";
import type { ProposalSafeActionBinding } from "@/types/proposal-lifecycle-engine";

export function bindProposalSafeAction(safeActionProfile: SafeActionProfile): ProposalSafeActionBinding {
  const futureBound = safeActionProfile.scope.state === "future_bound";
  const forbidden =
    safeActionProfile.riskClass === "forbidden"
    || safeActionProfile.errors.some((error) => error.code.includes("FORBIDDEN"));

  return Object.freeze({
    safeActionId: safeActionProfile.definition.id,
    safeActionHash: safeActionProfile.safeActionHash,
    category: safeActionProfile.definition.category,
    riskClass: safeActionProfile.riskClass,
    valid: safeActionProfile.errors.length === 0 && !futureBound && !forbidden,
    futureBound,
    forbidden,
  });
}
