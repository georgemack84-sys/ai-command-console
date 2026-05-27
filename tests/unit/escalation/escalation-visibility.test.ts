import { describe, expect, it } from "vitest";

import { requireEscalationVisibility } from "@/services/escalation/escalationVisibility";

describe("requireEscalationVisibility", () => {
  it("requires operator visibility for every escalation", () => {
    expect(requireEscalationVisibility({ escalationType: "operator", blocked: false }).requiresOperatorVisibility).toBe(true);
  });

  it("requires visibility for emergency escalation", () => {
    expect(requireEscalationVisibility({ escalationType: "emergency", blocked: false }).reasons).toContain("critical_escalation_visibility_required");
  });
});
