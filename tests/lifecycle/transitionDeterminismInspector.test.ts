import { describe, expect, it } from "vitest";
import { inspectLifecycleDeterminism } from "@/services/lifecycle/transitionDeterminismInspector";
import { buildLifecycleFixture } from "./helpers";

describe("transition determinism inspector", () => {
  it("accepts stable deterministic lifecycle records", () => {
    const { computation } = buildLifecycleFixture();
    expect(inspectLifecycleDeterminism(computation.record)).toEqual([]);
  });
});
