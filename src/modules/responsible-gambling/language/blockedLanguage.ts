export const blockedPickLanguage = [
  "bet this now",
  "take this line",
  "play this prop",
  "pick of the day",
  "best bet",
  "recommended wager",
] as const;

export const blockedGuaranteeLanguage = [
  "guaranteed win",
  "lock of the day",
  "safe profit",
  "can't lose",
  "risk free",
  "risk-free",
  "sure thing",
  "max confidence pick",
  "guaranteed edge",
  "easy money",
] as const;

export const blockedAutomationLanguage = [
  "place bet",
  "create bet slip",
  "auto wager",
  "confirm stake",
  "submit wager",
  "wager execution",
  "sportsbook automation",
] as const;

export const blockedMisleadingConfidenceLanguage = [
  "max confidence",
  "100% confidence",
  "can't miss",
  "high confidence lock",
  "guaranteed edge",
] as const;

export const prohibitedResponsibleGamblingFields = [
  "recommendation",
  "pick",
  "bet_advice",
  "wager_instruction",
  "edge_score",
  "confidence_score",
  "expected_value",
  "projected_winner",
  "stake_size",
  "unit_size",
  "bankroll_allocation",
  "lock_rating",
  "sharp_action",
] as const;

export function includesBlockedPhrase(text: string, phrases: readonly string[]): string | undefined {
  const normalized = text.toLowerCase();
  return phrases.find((phrase) => normalized.includes(phrase));
}
