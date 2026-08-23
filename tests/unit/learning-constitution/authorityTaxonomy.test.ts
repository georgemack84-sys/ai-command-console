import { describe, expect, it } from "vitest";
import {
  AUTHORITY_TAXONOMY,
  AUTHORITY_TYPES,
  getAuthorityTaxonomyEntry,
} from "../../../services/learning-constitution";

describe("Phase 6 authority taxonomy", () => {
  it("defines each canonical authority type exactly once without a universal strength order", () => {
    expect(AUTHORITY_TYPES).toHaveLength(10);
    expect(Object.keys(AUTHORITY_TAXONOMY)).toEqual([...AUTHORITY_TYPES]);
    expect(JSON.stringify(AUTHORITY_TAXONOMY)).not.toMatch(/precedence|rank|strength/i);
  });

  it("keeps distinct human semantics instead of inflating every human statement into a directive", () => {
    expect(getAuthorityTaxonomyEntry("HUMAN_DIRECTIVE").semanticMeaning).toContain("instruction");
    expect(getAuthorityTaxonomyEntry("HUMAN_DECISION").semanticMeaning).toContain("selection");
    expect(getAuthorityTaxonomyEntry("HUMAN_CORRECTION").semanticMeaning).toContain("correction");
    expect(getAuthorityTaxonomyEntry("HUMAN_PREFERENCE").doesNotImply).toContain("a directive");
  });

  it("preserves external and agent knowledge as non-decision authority", () => {
    expect(getAuthorityTaxonomyEntry("VERIFIED_EXTERNAL_INFORMATION").doesNotImply).toContain("human decision authority");
    expect(getAuthorityTaxonomyEntry("AGENT_DERIVED").doesNotImply).toContain("human establishment");
    expect(getAuthorityTaxonomyEntry("AGENT_INFERRED").doesNotImply).toContain("human preference");
    expect(getAuthorityTaxonomyEntry("AGENT_HYPOTHESIS").doesNotImply).toContain("authority promotion");
  });
});
