import { describe, expect, it } from "vitest";
import { buildDeterministicConfidenceFixture } from "@/tests/integration/confidence-engine/helpers";

describe("confidence authority expansion red-team", () => {
  it("blocks authority-expansion semantics", () => {
    const base = buildDeterministicConfidenceFixture();
    const fixture = buildDeterministicConfidenceFixture({
      proposalIntegrityResult: {
        ...base.input.proposalIntegrityResult,
        proposal: {
          ...base.input.proposalIntegrityResult.proposal,
          scopeBoundaries: Object.freeze([
            ...(base.input.proposalIntegrityResult.proposal.scopeBoundaries as readonly typeof base.input.proposalIntegrityResult.proposal.scopeBoundaries[number][]),
            Object.freeze({
              boundaryId: "boundary-runtime-execute",
              domain: "runtime.execute",
              description: "runtime.execute hidden execution scope",
              immutable: true as const,
            }),
          ]) as typeof base.input.proposalIntegrityResult.proposal.scopeBoundaries,
        },
      },
    });

    expect(fixture.result.errors.some((error) => error.code === "DETERMINISTIC_CONFIDENCE_AUTHORITY_ESCALATION")).toBe(true);
  });
});
