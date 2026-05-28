import { describe, expect, it } from "vitest";
import { guardLifecycleRequest } from "@/services/lifecycle/lifecycleBoundaryGuards";
import { buildLifecycleFixture } from "./helpers";

describe("lifecycle boundary guards", () => {
  it("rejects scheduling emergence metadata", () => {
    const { request } = buildLifecycleFixture({
      metadata: Object.freeze({ schedulerId: "scheduler-1" }),
    });
    expect(guardLifecycleRequest(request).map((error) => error.code)).toContain("LIFECYCLE_SCHEDULING_REJECTED");
  });

  it("rejects hidden retry metadata", () => {
    const { request } = buildLifecycleFixture({
      metadata: Object.freeze({ retryLoop: true }),
    });
    expect(guardLifecycleRequest(request).map((error) => error.code)).toContain("LIFECYCLE_HIDDEN_RETRY_REJECTED");
  });
});
