import { describe, expect, it } from "vitest";

import { buildVersionedReplayReadiness, migrateVersionedArtifact } from "@/services/planning/versioning";
import { buildVersioningFixture } from "./helpers";

describe("migration engine", () => {
  it("unsupported schema version blocks", () => {
    const fixture = buildVersioningFixture();
    const result = buildVersionedReplayReadiness({
      ...fixture,
      targetVersion: "9.9.9",
    });
    expect(result.ok).toBe(false);
    expect(result.failures.some((failure) => failure.code === "SCHEMA_REGISTRY_MISSING")).toBe(true);
  });

  it("broken migration chain blocks", () => {
    const fixture = buildVersioningFixture();
    const ready = buildVersionedReplayReadiness({
      ...fixture,
      targetVersion: "4.2H",
    });
    expect(ready.ok).toBe(true);
    if (!ready.ok || !ready.artifact) {
      return;
    }
    const migrated = migrateVersionedArtifact(ready.artifact, "4.2I", []);
    expect(migrated.ok).toBe(false);
  });

  it("multi-hop migration preserves lineage", () => {
    const fixture = buildVersioningFixture();
    const result = buildVersionedReplayReadiness(fixture);
    expect(result.ok).toBe(true);
    if (!result.ok || !result.artifact) {
      return;
    }
    expect(result.artifact.migrationLineage).toHaveLength(2);
    expect(result.artifact.replayLineageInvariant.originalExecutionTruthHash).toBe(fixture.executionCompatibilityContract.executionTruthHash);
  });
});
