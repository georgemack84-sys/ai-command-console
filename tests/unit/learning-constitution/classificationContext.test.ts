import { describe, expect, it } from "vitest";

import {
  DEFAULT_MAXIMUM_CLASSIFICATION_CONTEXT_FRAMES,
  buildConservativeClassificationContextWindow,
} from "@/services/learning-constitution";

const frame = (frameId: string, source: "IMMEDIATE_CONVERSATION" | "HISTORICAL_CONVERSATION", modes: readonly "BRAINSTORM_CONTEXT"[] = []) => ({
  frameId, source, sourceId: frameId, modes, content: frameId,
});

describe("classification context window", () => {
  it("uses a bounded explicit priority order instead of unlimited history", () => {
    const result = buildConservativeClassificationContextWindow({
      currentContent: "A queue could help.", maximumFrames: 1,
      frames: [frame("history", "HISTORICAL_CONVERSATION"), frame("immediate", "IMMEDIATE_CONVERSATION")],
    });
    expect(result.frames.map((item) => item.frameId)).toEqual(["immediate"]);
    expect(result).toMatchObject({ persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false });
  });

  it("enters explicit modes and lets a current decision exit inherited brainstorming", () => {
    const brainstorm = buildConservativeClassificationContextWindow({ currentContent: "Let's brainstorm storage options.", maximumFrames: 0, frames: [] });
    expect(brainstorm.activeModes).toEqual(["BRAINSTORM_CONTEXT"]);
    const decision = buildConservativeClassificationContextWindow({
      currentContent: "We decided to use PostgreSQL.", maximumFrames: 1,
      frames: [frame("brainstorm", "IMMEDIATE_CONVERSATION", ["BRAINSTORM_CONTEXT"])],
    });
    expect(decision.activeModes).toEqual(["DECISION_CONTEXT"]);
    expect(decision.reasonCodes).toEqual(["CURRENT_DECISION_OVERRIDES_BRAINSTORM_CONTEXT"]);
  });

  it("rejects oversized and malformed context windows", () => {
    expect(() => buildConservativeClassificationContextWindow({ currentContent: "x", maximumFrames: 1, frames: Array.from({ length: DEFAULT_MAXIMUM_CLASSIFICATION_CONTEXT_FRAMES + 1 }, (_, index) => frame(String(index), "HISTORICAL_CONVERSATION")) })).toThrow();
    expect(() => buildConservativeClassificationContextWindow({ currentContent: "", maximumFrames: 0, frames: [] })).toThrow();
  });
});
