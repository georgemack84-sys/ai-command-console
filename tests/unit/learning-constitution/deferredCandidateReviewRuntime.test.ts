import { describe, expect, it } from "vitest";

import { createDeferredCandidateReviewQueue } from "@/src/server/learning/deferred-candidate-review-runtime";

describe("deferred candidate review runtime", () => {
  it("rejects a workspace identifier that could escape its durable storage namespace", () => {
    expect(() => createDeferredCandidateReviewQueue("../other-workspace")).toThrow("Invalid workspace identifier");
  });

  it("creates a workspace-isolated review queue for valid identifiers", () => {
    expect(createDeferredCandidateReviewQueue("workspace_1")).toBeDefined();
  });
});
