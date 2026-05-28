import { describe, expect, it } from "vitest";

import { buildExecutionSafetyContract, hashExecutionSafetyContract } from "@/services/planning/execution-safety";

import { buildExecutionSafetyFixture } from "./helpers";

describe("execution safety hasher", () => {
  it("is deterministic and excludes transient runtime fields", () => {
    const fixture = buildExecutionSafetyFixture();
    const built = buildExecutionSafetyContract(fixture);
    expect(built.ok).toBe(true);
    if (!built.ok) return;

    const first = hashExecutionSafetyContract({ contract: built.contract });
    const second = hashExecutionSafetyContract({ contract: { ...built.contract } });
    expect(first).toBe(second);
  });
});
