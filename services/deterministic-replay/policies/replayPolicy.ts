export const DETERMINISTIC_REPLAY_POLICY = Object.freeze({
  historicalOnly: true,
  advisoryOnly: true,
  executable: false,
  executionAuthorized: false,
  operatorReviewRequired: true,
  failClosedOnUncertainty: true,
  dynamicResolutionForbidden: true,
  authorityRestorationForbidden: true,
});
