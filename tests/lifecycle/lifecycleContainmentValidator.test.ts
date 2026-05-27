import { describe, expect, it } from "vitest";
import { validateLifecycleContainment } from "@/services/lifecycle/lifecycleContainmentValidator";
import { buildLifecycleFixture } from "./helpers";

describe("lifecycle containment validator", () => {
  it("accepts non-operational lifecycle requests", () => {
    const { request } = buildLifecycleFixture();
    expect(validateLifecycleContainment(request)).toEqual([]);
  });

  it("rejects correlation-driven progression", () => {
    const { request } = buildLifecycleFixture({
      metadata: Object.freeze({ correlationDrivenTransition: true }),
    });
    expect(validateLifecycleContainment(request).map((error) => error.code)).toContain("LIFECYCLE_CORRELATION_DRIVEN_TRANSITION_REJECTED");
  });
});
