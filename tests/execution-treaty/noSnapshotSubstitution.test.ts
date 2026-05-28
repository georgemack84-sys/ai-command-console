import { describe, expect, it } from "vitest";
import { verifyExecutionTreatyIntegrity } from "@/services/execution-treaty";
import { buildExecutionTreatyFixture } from "./helpers";

describe("no snapshot substitution", () => {
  it("detects tampered treaty hashes and snapshot substitution", () => {
    const { treaty } = buildExecutionTreatyFixture();
    const tampered = {
      ...treaty,
      manifest: {
        ...treaty.manifest,
        registrySnapshotHash: "sha256:tampered",
      },
    };

    const result = verifyExecutionTreatyIntegrity(tampered);

    expect(result.valid).toBe(false);
    expect(result.failures.some((failure) => failure.code === "HANDOFF_HASH_MISMATCH" || failure.code === "HANDOFF_REGISTRY_BINDING_MISSING")).toBe(true);
  });
});
