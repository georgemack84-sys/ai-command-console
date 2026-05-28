import type { HumanCoordinationOverrideInput } from "@/types/human-coordination-override";

export function shouldTriggerOverrideReview(input: {
  overrideInput: HumanCoordinationOverrideInput;
  freezeRequired: boolean;
  errorCount: number;
}): boolean {
  return input.freezeRequired
    || input.errorCount > 0
    || input.overrideInput.overrideType === "deny"
    || input.overrideInput.overrideType === "revoke";
}
