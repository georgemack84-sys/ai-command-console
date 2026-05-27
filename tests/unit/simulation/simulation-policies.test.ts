import { describe, expect, it } from "vitest";

import { validateSimulationPolicies } from "@/services/simulation/simulationPolicies";

describe("validateSimulationPolicies", () => {
  it("keeps simulations read-only and advisory-only", () => {
    const result = validateSimulationPolicies({
      dashboard: {
        auditHistory: [{ id: "audit_1" }],
      },
    } as never);

    expect(result.advisoryOnly).toBe(true);
    expect(result.canExecute).toBe(false);
  });
});
