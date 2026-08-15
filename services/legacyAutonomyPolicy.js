const ENABLED = "LEGACY_AUTONOMOUS_EXECUTION_ENABLED";
const RISK_ACCEPTED = "LEGACY_AUTONOMOUS_EXECUTION_RISK_ACCEPTED";

function isTrue(value) {
  return String(value || "").trim().toLowerCase() === "true";
}

function legacyAutonomyStatus(env = process.env) {
  const production = String(env.NODE_ENV || "").trim().toLowerCase() === "production";
  const explicitlyEnabled = isTrue(env[ENABLED]);
  const riskAccepted = isTrue(env[RISK_ACCEPTED]);

  return {
    allowed: !production || (explicitlyEnabled && riskAccepted),
    production,
    explicitlyEnabled,
    riskAccepted,
  };
}

function assertLegacyAutonomyAllowed(operation, env = process.env) {
  const status = legacyAutonomyStatus(env);
  if (status.allowed) return status;

  const error = new Error(
    `Legacy autonomous execution is quarantined in production (${operation}). ` +
      `Set both ${ENABLED}=true and ${RISK_ACCEPTED}=true only after an explicit risk review.`,
  );
  error.code = "LEGACY_AUTONOMY_QUARANTINED";
  throw error;
}

module.exports = {
  assertLegacyAutonomyAllowed,
  legacyAutonomyStatus,
};
