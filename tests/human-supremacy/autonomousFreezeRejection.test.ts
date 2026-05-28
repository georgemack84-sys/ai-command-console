import { describe, expect, it } from "vitest";

import { buildEmergencyFreeze } from "@/services/human-supremacy/emergencyFreezeSystem";

describe("autonomous freeze rejection", () => {
  it("rejects freeze creation without human initiator", () => {
    const result = buildEmergencyFreeze({
      coordinationId: "coord-1",
      initiatedBy: "",
      reason: "auto",
      freezeScope: "coordination",
      activatedAt: "2026-05-17T09:00:00.000Z",
    });

    expect(result.errors.map((error) => error.code)).toContain("HUMAN_SUPREMACY_AUTONOMOUS_FREEZE_FORBIDDEN");
  });
});
