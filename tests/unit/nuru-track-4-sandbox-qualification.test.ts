import { describe, expect, it } from "vitest";
import { isBuiltInLocalSandbox } from "@/src/server/services/workflow-sandbox-verification-service";
import { fingerprintSandboxInput } from "@/src/server/services/workflow-sandbox-receipt-service";

describe("Nuru Track 4 sandbox qualification", () => {
  it("uses a stable request fingerprint for idempotent replay and rejects target drift", () => {
    expect(fingerprintSandboxInput({ resource: "reference-workflow", query: "ocean" })).toBe(fingerprintSandboxInput({ query: "ocean", resource: "reference-workflow" }));
    expect(fingerprintSandboxInput({ resource: "reference-workflow", query: "ocean" })).not.toBe(fingerprintSandboxInput({ resource: "reference-workflow", query: "climate" }));
    expect(isBuiltInLocalSandbox("https://external.example/api/sandbox/")).toBe(false);
  });
});
