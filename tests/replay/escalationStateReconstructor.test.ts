import { describe, expect, it } from "vitest";
import { buildEscalationReplayGraph } from "@/services/replay/escalationReplayGraph";
import { reconstructEscalationState } from "@/services/replay/escalationStateReconstructor";

describe("escalation state reconstructor", () => {
  it("reconstructs historical escalation timeline without synthesis", () => {
    const graph = buildEscalationReplayGraph({
      coordinationId: "coord-1",
      freshnessHash: "f",
      lifecycleHash: "l",
      correlationHash: "c",
      coordinationHash: "g",
      readinessHash: "r",
      createdAt: "2026-05-17T07:00:00.000Z",
    });
    const result = reconstructEscalationState({
      coordinationId: "coord-1",
      replayGraph: graph,
      lineage: Object.freeze({
        ledgerId: "ledger-1",
        entries: Object.freeze([
          Object.freeze({
            entryId: "e1",
            escalationId: "esc-1",
            coordinationId: "coord-1",
            state: "review" as const,
            severity: "moderate" as const,
            replayGraphHash: graph.graphHash,
            createdAt: "2026-05-17T07:00:00.000Z",
          }),
        ]),
        lineageHash: "lineage-1",
      }),
    });
    expect(result.errors).toEqual([]);
    expect(result.timeline.states).toHaveLength(1);
  });
});
