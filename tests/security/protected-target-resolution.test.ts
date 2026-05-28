import { beforeEach, describe, expect, it } from "vitest";

import { createStructuredIntentRecord, resetIntentStore } from "@/services/intent/intentPersistence";
import { resolveOperationalIntentForPlanning } from "@/services/intent/intentResolutionEngine";

describe("protected target resolution", () => {
  beforeEach(() => {
    resetIntentStore();
  });

  it("escalates protected targets before planning", () => {
    const structured = createStructuredIntentRecord({
      intentId: "protected-target-resolution",
      rawInput: "read file src/app.ts",
      createdAt: 0,
    });
    const protectedStructured = {
      ...structured,
      rawInput: "read file C:\\Windows\\System32\\drivers\\etc\\hosts",
      normalizedInput: "read file c:\\windows\\system32\\drivers\\etc\\hosts",
      intent: {
        ...structured.intent,
        action: "read",
        target: "filesystem",
        parameters: {
          path: "C:\\Windows\\System32\\drivers\\etc\\hosts",
        },
      },
    };

    const result = resolveOperationalIntentForPlanning(protectedStructured);

    expect(result.semanticGovernance.protectedTargetDetected).toBe(true);
    expect(result.plannerAdmission.escalationRequired).toBe(true);
    expect(result.plannerAdmission.admissible).toBe(false);
  });
});
