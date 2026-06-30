import { describe, expect, it } from "vitest";
import { assertExplanationAllowed, explanationContainsBlockedLanguage } from "@/services/signal-engine";

describe("explanationGuardrails", () => {
  it("detects blocked recommendation language", () => {
    expect(explanationContainsBlockedLanguage("Bet this now.")).toBe(true);
    expect(explanationContainsBlockedLanguage("This is a lock.")).toBe(true);
    expect(explanationContainsBlockedLanguage("Guaranteed edge.")).toBe(true);
    expect(explanationContainsBlockedLanguage("Risk status: informational only.")).toBe(false);
  });

  it("throws when blocked explanation language is present", () => {
    expect(() => assertExplanationAllowed("Hammer this wager now.")).toThrowError("RECOMMENDATION_LANGUAGE_BLOCKED");
    expect(() => assertExplanationAllowed("Market movement detected. Verified source movement observed.")).not.toThrow();
  });
});
