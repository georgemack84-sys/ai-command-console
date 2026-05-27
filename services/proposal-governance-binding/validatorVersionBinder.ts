import type { GovernanceBindingInput, ProposalGovernanceBindingError, ValidatorVersionSet } from "./governanceBindingTypes";

export function bindValidatorVersions(input: GovernanceBindingInput): {
  validatorVersionSet: ValidatorVersionSet;
  errors: readonly ProposalGovernanceBindingError[];
} {
  const errors: ProposalGovernanceBindingError[] = [];
  const versions = input.validatorVersionSet;

  for (const [key, value] of Object.entries(versions)) {
    if (key !== "createdAt" && !String(value).length) {
      errors.push({
        code: "PROPOSAL_GOVERNANCE_BINDING_VALIDATOR_VERSION_MISMATCH",
        message: "Validator version binding requires all validator version identifiers to be present.",
        path: `validatorVersionSet.${key}`,
      });
    }
  }

  return {
    validatorVersionSet: Object.freeze(versions),
    errors: Object.freeze(errors),
  };
}
