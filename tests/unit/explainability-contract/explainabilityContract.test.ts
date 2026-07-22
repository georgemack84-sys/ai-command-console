import { describe, expect, it, vi } from "vitest";
import {
  getExplainabilityContract,
  getExplanation,
  registerExplanation,
  replayExplanation,
  searchExplanations,
  validateExplanationRepository,
} from "@/services/explainability-contract";
import type { ExplainabilityFailure, ExplainabilityScenario } from "@/types/explainability-contract";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.5.1 Explainability Contract", () => {
  it("defines the universal explainability doctrine", () => {
    const contract = getExplainabilityContract();

    expect(contract.doctrine.contract_version).toBe("explainability-contract/v8ALT.5.1");
    expect(contract.doctrine.explanation_types).toEqual(["PLANNING", "EXECUTION", "DELEGATION", "ORCHESTRATION", "SUPERVISION", "GOVERNANCE", "INTERVENTION", "REPLAY"]);
    expect(contract.doctrine.principles).toContain("anti-fabrication");
    expect(contract.validation.valid).toBe(true);
  });

  it("registers deterministic append-only explanation records", () => {
    const first = registerExplanation();
    const second = registerExplanation();

    expect(first.append_only).toBe(true);
    expect(first.read_only).toBe(true);
    expect(first.explanations.length).toBe(8);
    expect(first.repository_hash).toBe(second.repository_hash);
    expect(validateExplanationRepository(first).valid).toBe(true);
  });

  it("retrieves, searches, and replays explanations deterministically", () => {
    const repository = registerExplanation();
    const record = getExplanation(repository);
    const replay = replayExplanation(record);
    const search = searchExplanations({ tenant_id: repository.tenant_id, confidence_min: 0.8 }, repository);

    expect(record?.explanation_id).toBeTruthy();
    expect(replay.deterministic).toBe(true);
    expect(search.length).toBe(8);
    expect(search.map((item) => item.deterministic_order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("enforces anti-fabrication and advisory-only fields", () => {
    const record = getExplanation(registerExplanation());

    expect(record?.evidence_bound).toBe(true);
    expect(record?.inference_declared).toBe(true);
    expect(record?.unsupported_claims.length).toBe(0);
    expect(record?.fabricated_reasoning_detected).toBe(false);
    expect(record?.advisory_only).toBe(true);
  });

  it.each([
    ["DUPLICATE_EXPLANATION_ID", "EXPLANATION_ID_DUPLICATED"],
    ["MISSING_IDENTIFIERS", "REQUIRED_IDENTIFIERS_MISSING"],
    ["INCOMPLETE_DECISION_SUMMARY", "DECISION_SUMMARY_INCOMPLETE"],
    ["MISSING_SELECTED_OPTION", "SELECTED_OPTION_ABSENT"],
    ["UNDOCUMENTED_REJECTED_OPTIONS", "REJECTED_OPTIONS_UNDOCUMENTED"],
    ["MISSING_EVIDENCE", "EVIDENCE_REFERENCES_MISSING"],
    ["INCOMPLETE_POLICY_REFERENCES", "POLICY_REFERENCES_INCOMPLETE"],
    ["MISSING_CONSTITUTIONAL_REFERENCES", "CONSTITUTIONAL_REFERENCES_ABSENT"],
    ["AUTHORITY_VALIDATION_FAILURE", "AUTHORITY_VALIDATION_FAILED"],
    ["MISSING_CONFIDENCE_REASONING", "CONFIDENCE_REASONING_MISSING"],
    ["MISSING_RISK_REASONING", "RISK_REASONING_MISSING"],
    ["INVALID_REPLAY_REFERENCE", "REPLAY_REFERENCE_INVALID"],
    ["INTEGRITY_HASH_FAILURE", "INTEGRITY_HASH_INVALID"],
    ["ORDERING_VIOLATION", "DETERMINISTIC_ORDERING_VIOLATED"],
    ["CROSS_TENANT_REFERENCE", "CROSS_TENANT_REFERENCE_DETECTED"],
    ["FABRICATED_REASONING", "FABRICATED_REASONING_DETECTED"],
    ["ADVISORY_ONLY_VIOLATION", "ADVISORY_ONLY_VIOLATION"],
  ] as readonly [ExplainabilityScenario, ExplainabilityFailure][])("rejects %s", (scenario, failure) => {
    const repository = registerExplanation({ scenario });
    const validation = validateExplanationRepository(repository);

    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
  });
});
