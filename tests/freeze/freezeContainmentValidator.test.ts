import { describe, expect, it } from "vitest";
import { validateFreezeContainment } from "@/services/freeze/freezeContainmentValidator";

describe("freeze containment validator", () => {
  it("rejects pause/resume semantics", () => {
    const errors = validateFreezeContainment({
      freeze: Object.freeze({
        freezeId: "freeze-a",
        proposalId: "proposal-a",
        frozen: true,
        terminalContainment: true as const,
        visibilityRestricted: true,
        escalationRequired: true,
        replayQuarantined: true,
        reasonCodes: Object.freeze(["replay:quarantined"]),
        freezeHash: "freeze-hash",
        createdAt: "2026-05-17T06:10:00.000Z",
      }),
      metadata: Object.freeze({ resumeOnClear: true }),
    });
    expect(errors.map((error) => error.code)).toContain("FRESHNESS_PAUSE_RESUME_REJECTED");
  });
});
