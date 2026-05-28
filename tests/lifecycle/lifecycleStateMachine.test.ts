import { describe, expect, it } from "vitest";
import { resolveLifecycleStateTransition } from "@/services/lifecycle/lifecycleStateMachine";
import { buildLifecycleFixture } from "./helpers";

describe("lifecycle state machine", () => {
  it("allows only explicit permitted transitions", () => {
    const { request } = buildLifecycleFixture();
    const result = resolveLifecycleStateTransition(request, false);
    expect(result.resultingState).toBe("interpret");
    expect(result.errors).toEqual([]);
  });

  it("rejects lifecycle jumps", () => {
    const { request } = buildLifecycleFixture({
      currentState: "recommend",
      nextState: "bounded_coordination",
    });
    const result = resolveLifecycleStateTransition(request, false);
    expect(result.resultingState).toBe("recommend");
    expect(result.errors.map((error) => error.code)).toContain("LIFECYCLE_INVALID_TRANSITION");
  });
});
