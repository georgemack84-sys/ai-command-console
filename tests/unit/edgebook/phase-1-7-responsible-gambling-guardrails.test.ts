import { describe, expect, it } from "vitest";
import {
  applyResponsibleGamblingDisclaimer,
  classifyGamblingOutput,
  DEFAULT_RISK_WARNING,
  EXPANDED_RISK_WARNING,
  getRiskWarning,
  REQUIRED_RESPONSIBLE_GAMBLING_DISCLAIMER,
  SHORT_RESPONSIBLE_GAMBLING_DISCLAIMER,
  validateInformationalOnlyOutput,
} from "@/src/modules/responsible-gambling";

function expectAllowed(output: string) {
  expect(classifyGamblingOutput({ requested_output: output }).decision).toMatchObject({
    status: "ALLOWED_INFORMATIONAL",
    disclaimer_applied: true,
  });
}

function expectBlocked(output: string, status: string) {
  expect(classifyGamblingOutput({ requested_output: output }).decision).toMatchObject({ status });
}

describe("EdgeBook Phase 1.7 responsible gambling guardrails", () => {
  it("allows informational language", () => {
    expectAllowed("Risk status: informational only.");
  });

  it("allows market movement detected", () => {
    expectAllowed("Market movement detected.");
  });

  it("allows observation recorded", () => {
    expectAllowed("Observation recorded.");
  });

  it("allows source verified", () => {
    expectAllowed("Source verified.");
  });

  it("allows no betting recommendation generated", () => {
    expectAllowed("No betting recommendation generated.");
  });

  it("blocks bet this now", () => {
    expectBlocked("bet this now", "BLOCKED_PICK");
  });

  it("blocks guaranteed win", () => {
    expectBlocked("guaranteed win", "BLOCKED_GUARANTEE");
  });

  it("blocks lock of the day", () => {
    expectBlocked("lock of the day", "BLOCKED_GUARANTEE");
  });

  it("blocks safe profit", () => {
    expectBlocked("safe profit", "BLOCKED_GUARANTEE");
  });

  it("blocks max confidence pick", () => {
    expectBlocked("max confidence pick", "BLOCKED_GUARANTEE");
  });

  it("blocks recover losses", () => {
    expectBlocked("recover losses", "BLOCKED_CHASING_LOSSES");
  });

  it("blocks double down", () => {
    expectBlocked("double down", "BLOCKED_CHASING_LOSSES");
  });

  it("blocks all in", () => {
    expectBlocked("all in", "BLOCKED_CHASING_LOSSES");
  });

  it("blocks martingale", () => {
    expectBlocked("martingale", "BLOCKED_CHASING_LOSSES");
  });

  it("blocks auto wager", () => {
    expectBlocked("auto wager", "BLOCKED_AUTOMATION");
  });

  it("blocks create bet slip", () => {
    expectBlocked("create bet slip", "BLOCKED_AUTOMATION");
  });

  it("blocks sportsbook execution", () => {
    expectBlocked("sportsbook automation", "BLOCKED_AUTOMATION");
  });

  for (const field of ["recommendation", "edge_score", "confidence_score", "projected_winner", "stake_size", "expected_value"]) {
    it(`blocks ${field} field`, () => {
      expect(validateInformationalOnlyOutput("Market movement detected.", { [field]: "blocked" }).decision).toMatchObject({
        status: "BLOCKED_PREMATURE_RECOMMENDATION",
      });
    });
  }

  it("applies disclaimer automatically", () => {
    const result = classifyGamblingOutput({ requested_output: "Market movement detected." });
    expect(result.decision.allowed_output).toContain(REQUIRED_RESPONSIBLE_GAMBLING_DISCLAIMER);
  });

  it("applies disclaimer deterministically", () => {
    expect(applyResponsibleGamblingDisclaimer("Observation recorded.")).toBe(
      applyResponsibleGamblingDisclaimer("Observation recorded."),
    );
  });

  it("supports short disclaimer", () => {
    const result = classifyGamblingOutput({ requested_output: "Source verified.", disclaimer_level: "short" });
    expect(result.decision.allowed_output).toContain(SHORT_RESPONSIBLE_GAMBLING_DISCLAIMER);
  });

  it("provides deterministic risk warnings", () => {
    expect(getRiskWarning()).toBe(DEFAULT_RISK_WARNING);
    expect(getRiskWarning("expanded")).toBe(EXPANDED_RISK_WARNING);
  });
});

describe("EdgeBook Phase 1.7 responsible gambling boundaries", () => {
  it("prevents advice layer activation", () => {
    expect(validateInformationalOnlyOutput("Market movement detected.", { bet_advice: "blocked" }).decision.status).toBe(
      "BLOCKED_PREMATURE_RECOMMENDATION",
    );
  });

  it("prevents recommendation layer activation", () => {
    expect(validateInformationalOnlyOutput("Observation recorded.", { recommendation: "blocked" }).decision.status).toBe(
      "BLOCKED_PREMATURE_RECOMMENDATION",
    );
  });

  it("prevents prediction layer activation", () => {
    expect(validateInformationalOnlyOutput("Source verified.", { projected_winner: "blocked" }).decision.status).toBe(
      "BLOCKED_PREMATURE_RECOMMENDATION",
    );
  });

  it("events do not trigger betting actions", () => {
    const result = classifyGamblingOutput({ requested_output: "Market movement detected." });
    const eventKeys = result.events.map((event) => Object.keys(event).join(" ").toLowerCase()).join(" ");

    expect(eventKeys).not.toContain("place");
    expect(eventKeys).not.toContain("wager_instruction");
  });

  it("enforces informational-only mode", () => {
    expect(classifyGamblingOutput({ requested_output: "Market movement detected." }).decision).toMatchObject({
      status: "ALLOWED_INFORMATIONAL",
      disclaimer_applied: true,
    });
  });

  it("responsible gambling layer exposes no betting execution logic", async () => {
    const moduleExports = await import("@/src/modules/responsible-gambling");
    const exportedNames = Object.keys(moduleExports).join(" ").toLowerCase();

    expect(exportedNames).not.toContain("placebet");
    expect(exportedNames).not.toContain("betslip");
    expect(exportedNames).not.toContain("wagerexecution");
  });
});
