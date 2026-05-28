import { describe, expect, it } from "vitest";

import { bindCorrelationReplay } from "@/services/intent-correlation-engine/correlationReplayBinder";
import { buildIntentCorrelationFixture } from "./helpers";

describe("correlation replay binder", () => {
  it("binds only original replay inputs and produces stable hash", () => {
    const { input } = buildIntentCorrelationFixture();
    const left = bindCorrelationReplay({
      coordinationRecords: input.coordinationRecords,
      proposals: input.proposals,
      readinessGates: input.readinessGates,
      escalations: input.escalations,
      approvalGraphs: input.approvalGraphs,
      createdAt: input.createdAt,
    });
    const right = bindCorrelationReplay({
      coordinationRecords: input.coordinationRecords,
      proposals: input.proposals,
      readinessGates: input.readinessGates,
      escalations: input.escalations,
      approvalGraphs: input.approvalGraphs,
      createdAt: input.createdAt,
    });
    expect(left.errors).toEqual([]);
    expect(left.replayBinding.bindingHash).toBe(right.replayBinding.bindingHash);
  });
});
