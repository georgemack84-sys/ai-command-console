const BLOCKED_PATTERNS = [
  /\bbet\b/,
  /\block\b/,
  /\bguaranteed\b/,
  /free money/,
  /safe profit/,
  /must play/,
  /best pick/,
  /max confidence bet/,
  /\bwager\b/,
  /take this/,
  /\bhammer\b/,
  /sure thing/,
  /fade the public/,
  /sharp side confirmed/,
  /arbitrage opportunity/,
  /take the stale line/,
  /exploit this number/,
  /exploit volatility/,
  /bet before the line moves/,
];

const ALLOWED_NEUTRAL_PHRASES = [
  "no betting recommendation generated.",
  "no betting recommendation generated",
];

export function explanationContainsBlockedLanguage(explanation: string): boolean {
  const normalized = explanation.trim().toLowerCase();
  const sanitized = ALLOWED_NEUTRAL_PHRASES.reduce(
    (current, phrase) => current.replaceAll(phrase, ""),
    normalized,
  );
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(sanitized));
}

export function assertExplanationAllowed(explanation: string): void {
  if (explanationContainsBlockedLanguage(explanation)) {
    throw new Error("RECOMMENDATION_LANGUAGE_BLOCKED");
  }
}
