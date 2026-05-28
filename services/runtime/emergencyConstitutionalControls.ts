export function buildEmergencyConstitutionalControls(input: {
  sovereigntyState: string;
  containmentRequired: boolean;
  escalationRequired: boolean;
}) {
  return {
    freezeRequired: input.containmentRequired || ["EMERGENCY_CONTAINMENT", "CIVILIZATION_LOCKDOWN"].includes(input.sovereigntyState),
    lockdownVisible: input.sovereigntyState === "CIVILIZATION_LOCKDOWN",
    escalationRequired: input.escalationRequired,
    advisoryOnly: true as const,
  };
}
