import { describe, expect, it } from "vitest";

import { hashRecoveryEvidence } from "../../services/recovery/recoveryEvidenceHasher.ts";

function createBundle(overrides: Record<string, any> = {}) {
  return {
    executionId: "exec_1",
    readModel: { executionId: "exec_1", execution: { status: "running" } },
    timeline: {
      executionId: "exec_1",
      events: [{ eventId: "a", executionId: "exec_1", timestamp: 1, source: "execution", type: "execution_started", severity: "info", summary: "execution started" }],
      meta: { totalEvents: 1, timeRange: { start: 1, end: 1 }, completeness: "complete", warnings: [], matchesReadModel: true },
    },
    state: "normal",
    sections: {
      execution: { status: "running" },
      recovery: {},
      control: {},
      advisory: {},
      automation: {},
      autonomy: {},
      verification: {},
      learning: {},
      lock: {},
      ledger: {},
    },
    integrity: { hash: "placeholder", algorithm: "sha256", matchesReadModel: true },
    meta: { completeness: "complete", warnings: [], version: "3.5D-2" },
    ...overrides,
  };
}

describe("recovery evidence hasher", () => {
  it("hash deterministic", () => {
    const bundle = createBundle();
    expect(hashRecoveryEvidence(bundle as any)).toBe(hashRecoveryEvidence(bundle as any));
  });

  it("hash changes when data changes", () => {
    const first = hashRecoveryEvidence(createBundle() as any);
    const second = hashRecoveryEvidence(createBundle({ state: "disputed" }) as any);
    expect(first).not.toBe(second);
  });
});

