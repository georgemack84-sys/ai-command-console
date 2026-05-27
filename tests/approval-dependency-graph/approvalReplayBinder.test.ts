import { describe, expect, it } from "vitest";

import { bindApprovalReplay } from "@/services/approval-dependency-graph";
import { buildApprovalDependencyFixture } from "./helpers";

describe("approvalReplayBinder", () => {
  it("binds to original replay evidence only", () => {
    const { input } = buildApprovalDependencyFixture();
    const binding = bindApprovalReplay(input);
    expect(binding.reconstructionHash).toBe(input.replay.reconstructionHash);
    expect(binding.valid).toBe(true);
  });
});
