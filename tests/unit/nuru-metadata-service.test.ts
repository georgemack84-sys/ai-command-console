import { describe, expect, it } from "vitest";
import { normalizeMetadata, validateMetadata } from "@/src/server/services/nuru-metadata-service";

describe("Nuru Metadata Service", () => {
  it("normalizes valid Context Agent metadata against the architecture schema", () => {
    const metadata = normalizeMetadata({ project: "  Nuru ", phase: "V1", topic: " Agent / Service   Boundary ", scope: " V1 ", artifactType: "Architecture Decision", confidence: 0.94 });
    expect(validateMetadata("Architecture Decision", metadata).data).toMatchObject({ project: "Nuru", topic: "Agent / Service Boundary" });
  });

  it("rejects unrecognized fields and invalid controlled values", () => {
    const result = validateMetadata("Architecture Decision", { project: "Nuru", phase: "V2", topic: "Boundary", scope: "V1", artifactType: "Architecture Decision", confidence: 0.94, madeUp: true });
    expect(result.success).toBe(false);
  });
});
