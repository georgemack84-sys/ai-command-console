import { describe, expect, it, vi } from "vitest";
import {
  buildDecisionNarrativeObservabilitySurface,
  generateNarrative,
  getDecisionNarrativeEngineContract,
  getNarrative,
  replayNarrative,
  validateNarrative,
} from "@/services/decision-narrative-engine";
import type { NarrativeFailure, NarrativeScenario } from "@/types/decision-narrative-engine";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.5.2 Decision Narrative Engine", () => {
  it("defines a deterministic template-driven narrative doctrine", () => {
    const contract = getDecisionNarrativeEngineContract();

    expect(contract.doctrine.engine_version).toBe("decision-narrative-engine/v8ALT.5.2");
    expect(contract.doctrine.principles).toContain("deterministic-language-generation");
    expect(contract.doctrine.principles).toContain("template-driven-narratives");
    expect(contract.doctrine.principles).toContain("advisory-only");
    expect(contract.validation.valid).toBe(true);
  });

  it("generates deterministic immutable narrative repositories", () => {
    const first = generateNarrative();
    const second = generateNarrative();
    const narrative = getNarrative(first);

    expect(first.append_only).toBe(true);
    expect(first.narratives.length).toBe(1);
    expect(first.repository_hash).toBe(second.repository_hash);
    expect(narrative?.sections.length).toBe(8);
    expect(narrative?.rendered_text).toContain("Objective");
    expect(narrative?.rendered_text).toContain("Selected Plan");
    expect(validateNarrative(narrative).valid).toBe(true);
  });

  it("replays narrative text and hashes reproducibly", () => {
    const narrative = getNarrative(generateNarrative());
    const first = replayNarrative(narrative);
    const second = replayNarrative(narrative);

    expect(first.deterministic).toBe(true);
    expect(first.reconstructed_hash).toBe(first.original_hash);
    expect(first.replay_result_hash).toBe(second.replay_result_hash);
    expect(narrative?.rendered_text).toBe(getNarrative(generateNarrative())?.rendered_text);
  });

  it("renders all required narrative sections from source explanation evidence", () => {
    const narrative = getNarrative(generateNarrative());
    const titles = narrative?.sections.map((item) => item.title) ?? [];

    expect(titles).toEqual(["Objective", "Selected Plan", "Rejected Alternatives", "Execution Sequence", "Governance Decision", "Authority Approval", "Confidence And Risk", "Intervention History"]);
    expect(narrative?.sections.every((item) => item.evidence_references.length > 0)).toBe(true);
    expect(narrative?.rendered_text).toContain("approval status");
    expect(narrative?.rendered_text).toContain("operational risk");
    expect(narrative?.rendered_text).toContain("advisory only");
  });

  it("does not mutate plans, executions, evidence, governance, or authority", () => {
    const narrative = getNarrative(generateNarrative());

    expect(narrative?.advisory_only).toBe(true);
    expect(narrative?.plan_modified).toBe(false);
    expect(narrative?.execution_modified).toBe(false);
    expect(narrative?.evidence_modified).toBe(false);
    expect(narrative?.governance_modified).toBe(false);
    expect(narrative?.authority_escalated).toBe(false);
  });

  it.each([
    ["INCOMPLETE_DECISION_RECORD", "DECISION_RECORD_INCOMPLETE"],
    ["MISSING_EVIDENCE", "EVIDENCE_REFERENCES_MISSING"],
    ["MISSING_SELECTED_PLAN", "SELECTED_PLAN_UNDEFINED"],
    ["UNDOCUMENTED_REJECTED_ALTERNATIVES", "REJECTED_ALTERNATIVES_UNDOCUMENTED"],
    ["MISSING_GOVERNANCE_REFERENCES", "GOVERNANCE_REFERENCES_ABSENT"],
    ["MISSING_CONSTITUTIONAL_VALIDATION", "CONSTITUTIONAL_VALIDATION_UNAVAILABLE"],
    ["MISSING_AUTHORITY_APPROVAL", "AUTHORITY_APPROVAL_MISSING"],
    ["UNREPRODUCIBLE_CONFIDENCE_RISK", "CONFIDENCE_RISK_UNREPRODUCIBLE"],
    ["INVALID_REPLAY_REFERENCE", "REPLAY_REFERENCE_INVALID"],
    ["NONDETERMINISTIC_WORDING", "DETERMINISTIC_WORDING_FAILED"],
    ["FABRICATED_STATEMENT", "FABRICATED_STATEMENT_DETECTED"],
    ["CROSS_TENANT_EVIDENCE", "CROSS_TENANT_EVIDENCE_DETECTED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["ADVISORY_ONLY_VIOLATION", "ADVISORY_ONLY_VIOLATION"],
  ] as readonly [NarrativeScenario, NarrativeFailure][])("rejects %s", (scenario, failure) => {
    const narrative = getNarrative(generateNarrative({ scenario }));
    const validation = validateNarrative(narrative);

    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
  });

  it("exposes an observability surface without execution authority", () => {
    const repository = generateNarrative();
    const surface = buildDecisionNarrativeObservabilitySurface(repository);

    expect(surface.repository_id).toBe(repository.repository_id);
    expect(surface.narrative_count).toBe(1);
    expect(surface.narrative_types).toEqual(["PLANNING"]);
    expect(surface.advisory_only).toBe(true);
  });
});
