import { describe, expect, it } from "vitest";
import { buildBoundedHandoffContract } from "@/services/lifecycle/boundedHandoffContract";
import { buildLifecycleReplayBinding } from "@/services/lifecycle/lifecycleReplayBuilder";
import { appendLifecycleLedger } from "@/services/lifecycle/lifecycleAppendOnlyLedger";
import { buildLifecycleFixture } from "./helpers";

describe("bounded handoff contract", () => {
  it("remains read-only and non-executing", () => {
    const { request } = buildLifecycleFixture({
      currentState: "bounded_coordination",
      nextState: "bounded_handoff",
    });
    const replay = buildLifecycleReplayBinding(request);
    const lineage = appendLifecycleLedger({
      existing: request.existingLineage,
      transitionId: "handoff-transition",
      fromState: "bounded_coordination",
      toState: "bounded_handoff",
      proposalId: request.proposal.proposalId,
      replayHash: replay.replayBinding.reconstructionHash,
      createdAt: request.createdAt,
    });
    const handoff = buildBoundedHandoffContract({ request, replayBinding: replay.replayBinding, lineage });
    expect(handoff.executionAuthorized).toBe(false);
    expect(handoff.dispatchAuthorized).toBe(false);
    expect(handoff.schedulingAuthorized).toBe(false);
  });
});
