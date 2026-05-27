import { describe, expect, it } from "vitest";

import { replayValidateExecutionSafety, validateExecutionSafety } from "@/services/planning/execution-safety";

import { buildExecutionSafetyFixture } from "./helpers";

describe("execution safety replay validator", () => {
  it("detects replay divergence", () => {
    const fixture = buildExecutionSafetyFixture();
    const validated = validateExecutionSafety(fixture);
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;

    const replay = replayValidateExecutionSafety({
      ...fixture,
      contract: validated.contract,
    });
    expect(replay.ok).toBe(true);

    const tampered = replayValidateExecutionSafety({
      ...fixture,
      contract: { ...validated.contract, executionSafetyHash: "tampered" },
    });
    expect(tampered.ok).toBe(false);
  });
});
