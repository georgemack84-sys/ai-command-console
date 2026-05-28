import { describe, expect, it } from "vitest";

import { buildOverrideContract } from "@/services/human-override-contract";
import { buildOverrideFixture } from "./helpers";

describe("override adversarial constraints", () => {
  it("fails closed on forged override authority and governance mismatch", () => {
    const { input } = buildOverrideFixture({
      events: Object.freeze([
        Object.freeze({
          overrideId: "override-001",
          timestamp: "2026-05-16T16:00:00.000Z",
          operatorId: "operator-01",
          operatorRole: "",
          overrideType: "freeze" as const,
          targetType: "proposal" as const,
          targetId: "proposal-001",
          reasonCode: "manual_review",
          justification: "bad auth",
          authoritySnapshotHash: "",
          governanceSnapshotHash: "",
          approvalGraphHash: "approval",
          createdAt: "2026-05-16T16:00:00.000Z",
        }),
      ]),
    });
    const contract = buildOverrideContract(input);
    expect(contract.errors.map((error) => error.code)).toContain("OVERRIDE_AUTHORITY_INVALID");
  });

  it("fails closed on runtime mutation and approval bypass attempts", () => {
    const { input } = buildOverrideFixture({
      metadata: Object.freeze({
        runtimeBridge: true,
        execute: true,
      }),
    });
    const contract = buildOverrideContract(input);
    expect(contract.errors.map((error) => error.code)).toContain("OVERRIDE_GOVERNANCE_MISSING");
    expect(contract.active).toBe(true);
  });
});
