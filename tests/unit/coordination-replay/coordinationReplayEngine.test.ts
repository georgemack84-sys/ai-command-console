import { describe, expect, it } from "vitest";

import { buildCoordinationReplayFixture } from "@/tests/integration/coordination-replay/helpers";

describe("coordination replay engine", () => {
  it("reconstructs immutable coordination replay deterministically", () => {
    const first = buildCoordinationReplayFixture();
    const second = buildCoordinationReplayFixture();

    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
    expect(first.result.audit.evidenceHash).toBe(second.result.audit.evidenceHash);
    expect(first.result.ledger.ledgerHash).toBe(second.result.ledger.ledgerHash);
  });

  it("keeps replay authority permanently false-only", () => {
    const fixture = buildCoordinationReplayFixture();
    expect(fixture.result.authorityContract).toEqual({
      executionAuthority: false,
      orchestrationAuthority: false,
      schedulingAuthority: false,
      governanceMutationAuthority: false,
      runtimeMutationAuthority: false,
      approvalInheritance: false,
      authorityInheritance: false,
      autonomousIntervention: false,
      workflowContinuation: false,
    });
  });
});
