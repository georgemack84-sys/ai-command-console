import type { ConstitutionalEnforcementAction } from "../decision/recoveryDecisionTypes";

export type ConstitutionalForecastConstraint = {
  forecastsAreAdvisoryOnly: true;
  forecastsCannotAuthorizeRecovery: true;
  forecastsCannotReduceGovernance: true;
  forecastsMayIncreaseRestrictions: true;
  disputedForecastsRequireReview: true;
};

export const CONSTITUTIONAL_FORECAST_CONSTRAINT: ConstitutionalForecastConstraint = {
  forecastsAreAdvisoryOnly: true,
  forecastsCannotAuthorizeRecovery: true,
  forecastsCannotReduceGovernance: true,
  forecastsMayIncreaseRestrictions: true,
  disputedForecastsRequireReview: true,
};

const PRECEDENCE: ConstitutionalEnforcementAction[] = [
  "DENY",
  "FREEZE",
  "CONTAIN",
  "ESCALATE",
  "REQUIRE_APPROVAL",
  "WARN",
  "ALLOW",
];

export function compareConstitutionalActions(
  left: ConstitutionalEnforcementAction,
  right: ConstitutionalEnforcementAction,
) {
  return PRECEDENCE.indexOf(left) - PRECEDENCE.indexOf(right);
}

export function isForecastRestrictionIncreaseAllowed(action: ConstitutionalEnforcementAction) {
  return PRECEDENCE.indexOf(action) <= PRECEDENCE.indexOf("WARN");
}
