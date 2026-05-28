export const RECOMMENDATION_VALIDATION_POLICY = Object.freeze({
  advisoryOnlyRequired: true,
  operatorReviewRequired: true,
  executionAuthorizedRequired: false,
  executableRequired: false,
  orchestrationAllowedRequired: false,
  runtimeMutationAllowedRequired: false,
  authorityMutationAllowedRequired: false,
  governanceMutationAllowedRequired: false,
  schedulerRegistrationAllowedRequired: false,
  failClosedOnUncertainty: true,
});
