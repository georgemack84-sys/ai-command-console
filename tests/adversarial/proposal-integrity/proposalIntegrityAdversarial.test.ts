import { describe, expect, it } from "vitest";
import { buildProposalIntegrityFixture } from "@/tests/integration/proposal-integrity/helpers";

describe("proposal integrity adversarial", () => {
  it.each([
    { summary: "recommend and execute immediately", code: "PROPOSAL_EXECUTION_SEMANTICS_DETECTED" },
    { summary: "begin orchestration after approval", code: "PROPOSAL_ORCHESTRATION_LINKAGE_DETECTED" },
    { summary: "schedule after timeout", code: "PROPOSAL_SCHEDULER_LINKAGE_DETECTED" },
    { metadata: { authorityExpansion: true }, code: "PROPOSAL_AUTHORITY_EXPANSION_DETECTED" },
    { metadata: { syntheticAncestry: true }, code: "PROPOSAL_SYNTHETIC_ANCESTRY_DETECTED" },
  ])("rejects adversarial proposal %#", ({ summary, metadata, code }) => {
    const fixture = buildProposalIntegrityFixture({
      ...(summary ? { summary } : {}),
      ...(metadata ? { metadata: Object.freeze(metadata) } : {}),
    });
    expect(fixture.result.errors.some((error) => error.code === code)).toBe(true);
  });
});
