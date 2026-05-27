import { describe, expect, it } from "vitest";
import { bindGovernanceTreatyEvidence } from "@/services/execution-treaty";
import { buildExecutionTreatyFixture } from "./helpers";

describe("governance binding integrity", () => {
  it("fails when governance inheritance inputs are missing or invalid", () => {
    const { input } = buildExecutionTreatyFixture();
    const result = bindGovernanceTreatyEvidence({
      governanceSnapshotHash: "",
      approvalChainHash: undefined,
      provenanceHash: input.trustedSnapshotAdmission.ok ? input.trustedSnapshotAdmission.provenance.registrySnapshotHash : undefined,
      governanceVerified: false,
    });

    expect(result.failures.length).toBeGreaterThan(0);
    expect(result.failures.some((failure) => failure.code === "HANDOFF_GOVERNANCE_INHERITANCE_INVALID")).toBe(true);
  });
});
