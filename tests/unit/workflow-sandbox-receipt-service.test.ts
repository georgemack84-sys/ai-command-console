import { describe, expect, it } from "vitest";
import { fingerprintSandboxInput } from "@/src/server/services/workflow-sandbox-receipt-service";

describe("workflow sandbox receipt fingerprints", () => {
  it("is stable across object property ordering", () => {
    expect(fingerprintSandboxInput({ resource: "reference-workflow", query: "Jacques Cousteau" })).toBe(fingerprintSandboxInput({ query: "Jacques Cousteau", resource: "reference-workflow" }));
  });

  it("changes when the request changes", () => {
    expect(fingerprintSandboxInput({ query: "Jacques Cousteau" })).not.toBe(fingerprintSandboxInput({ query: "Sylvia Earle" }));
  });
});
