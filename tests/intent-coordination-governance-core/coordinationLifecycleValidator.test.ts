import { describe, expect, it } from "vitest";

import { validateCoordinationLifecycle } from "@/services/intent-coordination-governance-core/coordinationLifecycleValidator";

describe("coordination lifecycle validator", () => {
  it("allows lawful transitions", () => {
    const result = validateCoordinationLifecycle({
      currentState: "proposed",
      requestedTransition: "validate",
      escalationActive: false,
      errorsPresent: false,
    });
    expect(result.errors).toEqual([]);
    expect(result.resultingState).toBe("validated");
  });

  it("rejects invalid transitions", () => {
    const result = validateCoordinationLifecycle({
      currentState: "proposed",
      requestedTransition: "archive",
      escalationActive: false,
      errorsPresent: false,
    });
    expect(result.errors.some((error) => error.code === "INVALID_COORDINATION_TRANSITION")).toBe(true);
    expect(result.resultingState).toBe("proposed");
  });
});
