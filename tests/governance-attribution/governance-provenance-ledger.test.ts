import { describe, expect, it } from "vitest";

import { buildGovernanceProvenanceEvent, validateGovernanceProvenanceLedger } from "@/services/governance-attribution";
import { buildGovernanceFixture } from "./helpers";

describe("governance provenance ledger", () => {
  it("is deterministic and append-only", () => {
    const { attribution } = buildGovernanceFixture();
    const first = buildGovernanceProvenanceEvent({
      eventType: "governance.created",
      governanceHash: attribution.governanceHash!,
      previousEventHash: null,
      payload: { seq: 1 },
    });
    const second = buildGovernanceProvenanceEvent({
      eventType: "governance.validated",
      governanceHash: attribution.governanceHash!,
      previousEventHash: first.eventHash,
      payload: { seq: 2 },
    });

    expect(validateGovernanceProvenanceLedger([first, second])).toEqual([]);
  });

  it("fails on provenance discontinuity", () => {
    const { attribution } = buildGovernanceFixture();
    const first = buildGovernanceProvenanceEvent({
      eventType: "governance.created",
      governanceHash: attribution.governanceHash!,
      previousEventHash: null,
      payload: { seq: 1 },
    });
    const second = buildGovernanceProvenanceEvent({
      eventType: "governance.validated",
      governanceHash: attribution.governanceHash!,
      previousEventHash: "forged",
      payload: { seq: 2 },
    });

    expect(validateGovernanceProvenanceLedger([first, second])[0]?.code).toBe("TOOL_GOVERNANCE_PROVENANCE_INVALID");
  });
});
