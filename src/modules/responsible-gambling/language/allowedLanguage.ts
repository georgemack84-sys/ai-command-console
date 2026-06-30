export const allowedResponsibleGamblingLanguage = [
  "Market movement detected.",
  "Observation recorded.",
  "Source verified.",
  "No betting recommendation generated.",
  "Risk status: informational only.",
] as const;

export const allowedOutputFields = [
  "observation_status",
  "verification_status",
  "source_status",
  "movement_status",
  "informational_only",
  "risk_status",
] as const;
