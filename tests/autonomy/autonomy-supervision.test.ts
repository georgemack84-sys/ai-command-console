import { describe, expect, it } from "vitest";

import { validateAutonomyConstraints } from "@/services/validation/autonomyConstraintValidation";

describe("validateAutonomyConstraints", () => {
  it("preserves advisory-only autonomy limitation guarantees", () => {
    const result = validateAutonomyConstraints({
      autonomyPromotionAllowed: false,
      advisoryOnly: true,
      approvalRequired: true,
      containmentRequired: true,
      disputed: false,
      createdAt: 10,
    });

    expect(result.autonomySafe).toBe(true);
    expect(result.warnings).toContain("autonomy_promotion_blocked");
  });
});
