import { describe, expect, it } from "vitest";
import { detectReadinessDrift } from "@/services/constitutional-autonomy-readiness-gate";
import { buildConstitutionalReadinessGateFixture } from "./helpers";

describe("detectReadinessDrift", () => {
  it("detects no drift for aligned hashes", () => {
    const { input } = buildConstitutionalReadinessGateFixture();
    const result = detectReadinessDrift({
      readinessProfile: input.readinessProfile,
      safeActionProfile: input.safeActionProfile,
      proposal: input.proposal,
      escalation: input.escalation,
      createdAt: input.generatedAt,
    });

    expect(result.driftDetected).toBe(false);
  });
});
