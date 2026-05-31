import { describe, expect, it } from "vitest";

import * as route from "@/app/api/advisory/status/route";

describe("advisory status API", () => {
  it("returns the normalized advisory read model", async () => {
    const response = await route.GET();
    const body = await response.json();

    expect(body.ok).toBe(true);
    expect(body.data.authority).toBe("READ_ONLY");
    expect(body.data.mayDeploy).toBe(false);
    expect(body.data.mayRetry).toBe(false);
    expect(body.data.mayRollback).toBe(false);
    expect(body.data.mayCancel).toBe(false);
    expect(body.data.mayResume).toBe(false);
    expect(body.data.mayApprove).toBe(false);
    expect(body.data.mayOverride).toBe(false);
    expect(body.data.snapshotHash).toMatch(/^sha256:/);
  });

  it("is GET only", () => {
    expect("GET" in route).toBe(true);
    expect("POST" in route).toBe(false);
    expect("PUT" in route).toBe(false);
    expect("PATCH" in route).toBe(false);
    expect("DELETE" in route).toBe(false);
  });
});
