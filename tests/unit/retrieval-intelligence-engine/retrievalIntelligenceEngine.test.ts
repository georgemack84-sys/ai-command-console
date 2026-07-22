import { describe, expect, it } from "vitest";

import {
  getRetrievalIntelligenceContract,
  replayRetrievalIntelligence,
  runRetrievalIntelligence,
  validateRetrievalIntelligence,
} from "../../../services/retrieval-intelligence-engine";

describe("retrieval intelligence engine", () => {
  it("runs deterministic certified governed retrieval", () => {
    const first = runRetrievalIntelligence();
    const second = runRetrievalIntelligence();

    expect(first.certification.status).toBe("PASS");
    expect(first.certification.production_ready).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateRetrievalIntelligence(first).valid).toBe(true);
    expect(replayRetrievalIntelligence(first)).toBe(true);
  });

  it("preserves governance-first retrieval instead of conventional RAG", () => {
    const bundle = getRetrievalIntelligenceContract();

    expect(bundle.doctrine.governance_first).toBe(true);
    expect(bundle.doctrine.conventional_rag).toBe(false);
    expect(bundle.doctrine.certified_only).toBe(true);
    expect(bundle.doctrine.never_retrieve_rules).toContain("cross-tenant intelligence");
  });

  it("returns only certified, policy-valid, confidence-qualified records", () => {
    const result = runRetrievalIntelligence();

    expect(result.historical_reasoning_certified).toBe(true);
    expect(result.approved_records).toHaveLength(3);
    expect(result.rejected_records.length).toBeGreaterThan(0);
    expect(result.approved_records.every((item) => item.qualified && item.certified && item.governance_approved && item.constitutional_permitted)).toBe(true);
    expect(result.approved_records.every((item) => item.confidence >= result.contract.minimum_confidence)).toBe(true);
  });

  it("produces deterministic ranking and complete explanations", () => {
    const result = runRetrievalIntelligence();

    expect(result.rankings.map((item) => item.rank)).toEqual([1, 2, 3]);
    expect(result.rankings.every((item) => item.final_score >= 0.8)).toBe(true);
    expect(result.explanation.complete).toBe(true);
    expect(result.explanation.why_retrieved).toHaveLength(result.approved_records.length);
    expect(result.explanation.why_rejected).toHaveLength(result.rejected_records.length);
  });

  it("records retrieval lineage and append-only ledger entries", () => {
    const result = runRetrievalIntelligence();

    expect(result.record.evidence_refs.length).toBeGreaterThanOrEqual(result.approved_records.length);
    expect(result.record.approved_records).toHaveLength(3);
    expect(result.ledger).toHaveLength(10);
    expect(result.ledger.every((entry, index) => entry.append_only && entry.sequence === index + 1)).toBe(true);
  });

  it("runs the retrieval certification suite", () => {
    const result = runRetrievalIntelligence();

    expect(result.certification.tests).toHaveLength(33);
    expect(result.certification.tests.every((test) => test.passed)).toBe(true);
  });

  it("fails closed on governance, constitutional, tenant, confidence, and replay violations", () => {
    for (const scenario of ["GOVERNANCE_POLICY_VIOLATION", "CONSTITUTIONAL_POLICY_VIOLATION", "TENANT_ISOLATION_BREACH", "CONFIDENCE_THRESHOLD_BYPASS", "REPLAY_DIVERGENCE", "EXPLANATION_INCOMPLETE"] as const) {
      const result = runRetrievalIntelligence({ scenario });

      expect(result.certification.status).toBe("FAIL");
      expect(result.certification.production_ready).toBe(false);
      expect(result.certification.failures).toContain(scenario);
      expect(validateRetrievalIntelligence(result).valid).toBe(false);
    }
  });
});
