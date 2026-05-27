export type FrozenValidationContext = Readonly<{
  schemaVersion: string;
  validatorVersion: string;
  governancePolicyVersion: string;
  compatibilityMatrixVersion: string;
}>;

export const PLANNING_VALIDATOR_VERSION = "4.2B";
export const PLANNING_GOVERNANCE_POLICY_VERSION = "4.2B";
export const PLANNING_COMPATIBILITY_MATRIX_VERSION = "4.2B";

export function createFrozenValidationContext(input?: Partial<FrozenValidationContext>): FrozenValidationContext {
  return Object.freeze({
    schemaVersion: input?.schemaVersion ?? "1.1.0",
    validatorVersion: input?.validatorVersion ?? PLANNING_VALIDATOR_VERSION,
    governancePolicyVersion: input?.governancePolicyVersion ?? PLANNING_GOVERNANCE_POLICY_VERSION,
    compatibilityMatrixVersion: input?.compatibilityMatrixVersion ?? PLANNING_COMPATIBILITY_MATRIX_VERSION,
  });
}
