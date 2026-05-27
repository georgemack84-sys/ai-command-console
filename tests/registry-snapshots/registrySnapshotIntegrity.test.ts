import { describe, expect, it } from "vitest";
import { validateRegistrySnapshot } from "@/services/registry-snapshots";
import { buildRegistrySnapshotFixture } from "@/tests/registry-snapshots/helpers";

describe("registry snapshot integrity", () => {
  it("accepts a complete immutable registry snapshot", () => {
    const snapshot = buildRegistrySnapshotFixture();
    const result = validateRegistrySnapshot(snapshot);

    expect(result.valid).toBe(true);
  });

  it("detects tool, policy, governance, compatibility, rollback, and lineage mutation", () => {
    const snapshot = buildRegistrySnapshotFixture();
    const mutated: typeof snapshot = {
      ...snapshot,
      content: {
        ...snapshot.content,
        tools: snapshot.content.tools.map((tool, index) => index === 0 ? { ...tool, description: `${tool.description} mutated` } : tool),
        policies: {
          ...snapshot.content.policies,
          [snapshot.content.tools[0].policyRef]: {
            ...snapshot.content.policies[snapshot.content.tools[0].policyRef],
            timeoutMs: snapshot.content.policies[snapshot.content.tools[0].policyRef].timeoutMs + 1,
          },
        },
        governance: {
          ...snapshot.content.governance,
          [snapshot.content.tools[0].canonicalId]: {
            ...snapshot.content.governance[snapshot.content.tools[0].canonicalId],
            governanceMetadata: {
              ...snapshot.content.governance[snapshot.content.tools[0].canonicalId].governanceMetadata,
              auditLevel: "forensic" as const,
            },
          },
        },
        compatibility: {
          ...snapshot.content.compatibility,
          [snapshot.content.tools[0].canonicalId]: {
            ...snapshot.content.compatibility[snapshot.content.tools[0].canonicalId],
            migrationTargets: ["9.9.9"],
          },
        },
        rollback: {
          ...snapshot.content.rollback,
          [snapshot.content.tools[0].canonicalId]: {
            ...snapshot.content.rollback[snapshot.content.tools[0].canonicalId],
            rollbackMetadata: null,
          },
        },
        lineage: {
          ...snapshot.content.lineage,
          lineages: snapshot.content.lineage.lineages.map((lineage, index) => index === 0 ? { ...lineage, latestVersion: "9.9.9" } : lineage),
        },
      },
    };

    const result = validateRegistrySnapshot(mutated);
    expect(result.valid).toBe(false);
    expect(result.failures.length).toBeGreaterThan(0);
  });
});
