import { describe, expect, it } from "vitest";
import { validateRegistrySnapshot } from "@/services/registry-snapshots";
import { buildRegistrySnapshotFixture } from "@/tests/registry-snapshots/helpers";

describe("adversarial registry snapshot mutation", () => {
  it("rejects schema replacement, policy downgrade, governance downgrade, compatibility escalation, rollback removal, lineage rewrite, and hash spoofing", () => {
    const snapshot = buildRegistrySnapshotFixture();
    const mutated: typeof snapshot = {
      ...snapshot,
      manifest: {
        ...snapshot.manifest,
        registrySnapshotHash: "spoofed-hash",
      },
      content: {
        ...snapshot.content,
        schemas: snapshot.content.schemas.map((schema, index) => index === 0 ? { ...schema, content: { ...schema.content, title: "replaced" } } : schema),
        policies: {
          ...snapshot.content.policies,
          [snapshot.content.tools[0].policyRef]: {
            ...snapshot.content.policies[snapshot.content.tools[0].policyRef],
            replay: {
              ...snapshot.content.policies[snapshot.content.tools[0].policyRef].replay,
              deterministicMetadataRequired: false,
            },
          },
        },
        governance: {
          ...snapshot.content.governance,
          [snapshot.content.tools[0].canonicalId]: {
            ...snapshot.content.governance[snapshot.content.tools[0].canonicalId],
            governanceMetadata: {
              ...snapshot.content.governance[snapshot.content.tools[0].canonicalId].governanceMetadata,
              approvalLevel: "none" as const,
            },
          },
        },
        compatibility: {
          ...snapshot.content.compatibility,
          [snapshot.content.tools[0].canonicalId]: {
            ...snapshot.content.compatibility[snapshot.content.tools[0].canonicalId],
            supportsReplay: false,
          },
        },
        rollback: {
          ...snapshot.content.rollback,
          [snapshot.content.tools[0].canonicalId]: {
            ...snapshot.content.rollback[snapshot.content.tools[0].canonicalId],
            rollbackSupported: false,
            rollbackMetadata: null,
          },
        },
        lineage: {
          ...snapshot.content.lineage,
          lineages: snapshot.content.lineage.lineages.reverse(),
        },
      },
    };

    const result = validateRegistrySnapshot(mutated);
    expect(result.valid).toBe(false);
    expect(result.failures.length).toBeGreaterThan(0);
  });
});
