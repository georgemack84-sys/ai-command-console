import type { TeachBackPolicy as TeachBackPolicyContract, TeachBackPolicyInput, TeachBackRequirement } from "../../types/learning-constitution/teachBack";

const significant = new Set(["INSTRUCTION", "PROJECT_DECISION", "PRINCIPLE", "PROCEDURE", "CORRECTION", "EXCEPTION", "AUTHORITATIVE_RULE"]);
/** Stable MVP policy: significance is explicit, conservative, and independently testable. */
export class DeterministicTeachBackPolicy implements TeachBackPolicyContract {
  evaluate(input: TeachBackPolicyInput): TeachBackRequirement {
    if (input.securitySensitive || input.constitutional || input.conflictHistory || input.scope?.type === "GLOBAL" || input.scope?.type === "SYSTEM") return "REQUIRED";
    return significant.has(input.classification) ? "REQUIRED" : input.classification === "PREFERENCE" ? "OPTIONAL" : "NOT_REQUIRED";
  }
}
