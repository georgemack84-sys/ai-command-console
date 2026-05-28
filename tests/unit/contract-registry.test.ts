import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createContractDefinition, createContractRegistry } from "../../services/contracts/contractRegistry.ts";

describe("contract registry", () => {
  it("registers contracts with deterministic hashes", () => {
    const registry = createContractRegistry();
    const contract = createContractDefinition({
      id: "sam.proposal",
      version: "1.0.0",
      kind: "request",
      owner: "mission-control",
      schema: z.object({
        executionId: z.string(),
      }).strict(),
      governance: {
        approved: true,
        approvedBy: "operator_1",
        riskLevel: "high",
      },
    });

    registry.register(contract);
    const stored = registry.get("sam.proposal", "1.0.0");

    expect(stored?.hash).toBe(contract.hash);
    expect(registry.list().length).toBe(1);
  });

  it("rejects duplicate versions", () => {
    const registry = createContractRegistry();
    const contract = createContractDefinition({
      id: "sam.proposal",
      version: "1.0.0",
      kind: "request",
      owner: "mission-control",
      schema: z.object({ executionId: z.string() }).strict(),
      governance: {
        approved: true,
        approvedBy: "operator_1",
        riskLevel: "high",
      },
    });

    registry.register(contract);
    expect(() => registry.register(contract)).toThrow("API_SCHEMA_INVALID");
  });
});
