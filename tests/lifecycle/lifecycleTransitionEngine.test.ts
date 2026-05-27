import { describe, expect, it } from "vitest";
import { orchestrateBoundedIntentLifecycle } from "@/services/lifecycle/lifecycleTransitionEngine";
import { buildLifecycleFixture } from "./helpers";

describe("lifecycle transition engine", () => {
  it("produces deterministic lifecycle output", () => {
    const { request } = buildLifecycleFixture();
    const left = orchestrateBoundedIntentLifecycle(request);
    const right = orchestrateBoundedIntentLifecycle(request);
    expect(left.record.lifecycleHash).toBe(right.record.lifecycleHash);
    expect(left.record.replayBinding).toEqual(right.record.replayBinding);
  });

  it("does not mutate input", () => {
    const { request } = buildLifecycleFixture();
    const before = JSON.stringify(request);
    orchestrateBoundedIntentLifecycle(request);
    expect(JSON.stringify(request)).toBe(before);
  });
});
