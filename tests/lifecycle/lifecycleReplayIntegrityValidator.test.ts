import { describe, expect, it } from "vitest";
import { buildLifecycleReplayBinding } from "@/services/lifecycle/lifecycleReplayBuilder";
import { validateLifecycleReplayIntegrity } from "@/services/lifecycle/lifecycleReplayIntegrityValidator";
import { buildLifecycleFixture } from "./helpers";

describe("lifecycle replay integrity validator", () => {
  it("accepts contiguous immutable chronology", () => {
    const { request } = buildLifecycleFixture();
    const replay = buildLifecycleReplayBinding(request);
    expect(validateLifecycleReplayIntegrity({ request, replayBinding: replay.replayBinding })).toEqual([]);
  });

  it("rejects replay continuity gaps", () => {
    const { request } = buildLifecycleFixture({
      existingLineage: Object.freeze({
        ledgerId: "ledger-gap",
        entries: Object.freeze([
          Object.freeze({
            entryId: "gap-entry",
            transitionId: "gap-transition",
            proposalId: "proposal-a",
            fromState: "review",
            toState: "approved",
            replayHash: "gap-hash",
            createdAt: "2026-05-17T06:00:00.000Z",
          }),
        ]),
        lineageHash: "gap-lineage-hash",
      }),
    });
    const replay = buildLifecycleReplayBinding(request);
    expect(validateLifecycleReplayIntegrity({ request, replayBinding: replay.replayBinding }).map((error) => error.code)).toContain("LIFECYCLE_REPLAY_GAP_REJECTED");
  });
});
