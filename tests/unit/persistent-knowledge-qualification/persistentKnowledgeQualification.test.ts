import { describe, expect, it } from "vitest";

import {
  getPersistentKnowledgeQualificationContract,
  qualifyPersistentKnowledge,
  replayPersistentKnowledgeQualification,
  validatePersistentKnowledgeQualification,
} from "../../../services/persistent-knowledge-qualification";

describe("persistent knowledge qualification", () => {
  it("qualifies knowledge deterministically when every gate passes", () => {
    const first = qualifyPersistentKnowledge();
    const second = qualifyPersistentKnowledge();

    expect(first.certification.outcome).toBe("PASS");
    expect(first.certification.eligible_for_persistence).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validatePersistentKnowledgeQualification(first).valid).toBe(true);
    expect(replayPersistentKnowledgeQualification(first)).toBe(true);
  });

  it("enforces the no-persistence-without-qualification doctrine", () => {
    const contract = getPersistentKnowledgeQualificationContract();

    expect(contract.doctrine.no_persistence_without_successful_qualification).toBe(true);
    expect(contract.result.foundation_certified).toBe(true);
    expect(contract.result.contract.persistence_without_certification_supported).toBe(false);
    expect(contract.result.record.qualification_state).toBe("CERTIFIED");
  });

  it("runs the full qualification pipeline in deterministic order", () => {
    const result = qualifyPersistentKnowledge();

    expect(result.contract.lifecycle).toEqual([
      "KNOWLEDGE_CANDIDATE",
      "EVIDENCE_QUALIFICATION",
      "CONFIDENCE_QUALIFICATION",
      "TRUST_QUALIFICATION",
      "REPLAY_QUALIFICATION",
      "GOVERNANCE_QUALIFICATION",
      "CONSTITUTIONAL_QUALIFICATION",
      "DUPLICATE_CONSOLIDATION",
      "OPERATOR_APPROVAL",
      "CERTIFICATION",
      "PERSISTENT_KNOWLEDGE",
    ]);
    expect(result.evidence.passed).toBe(true);
    expect(result.confidence.passed).toBe(true);
    expect(result.trust.passed).toBe(true);
    expect(result.replay.passed).toBe(true);
    expect(result.governance.decision).toBe("APPROVED");
    expect(result.constitutional.qualification).toBe("COMPLIANT");
  });

  it("requires operator approval and deterministic duplicate consolidation", () => {
    const result = qualifyPersistentKnowledge();

    expect(result.operator_approval.required).toBe(true);
    expect(result.operator_approval.outcome).toBe("APPROVED");
    expect(result.duplicate_consolidation.duplicates_detected).toBe(2);
    expect(result.duplicate_consolidation.deterministic_merge).toBe(true);
    expect(result.duplicate_consolidation.lineage_preserved).toBe(true);
  });

  it("certifies the Phase 11.2 matrix and append-only ledger", () => {
    const result = qualifyPersistentKnowledge();

    expect(result.certification.tests).toHaveLength(20);
    expect(result.certification.tests.every((test) => test.passed)).toBe(true);
    expect(result.ledger).toHaveLength(10);
    expect(result.ledger.every((entry, index) => entry.append_only && entry.sequence === index + 1)).toBe(true);
  });

  it("blocks persistence when evidence is insufficient", () => {
    const result = qualifyPersistentKnowledge({ scenario: "INSUFFICIENT_EVIDENCE" });
    const validation = validatePersistentKnowledgeQualification(result);

    expect(result.certification.outcome).toBe("REQUIRES_MORE_EVIDENCE");
    expect(result.certification.eligible_for_persistence).toBe(false);
    expect(result.record.qualification_state).toBe("INSUFFICIENT_EVIDENCE");
    expect(result.certification.failures).toContain("INSUFFICIENT_EVIDENCE");
    expect(validation.valid).toBe(false);
  });

  it("fails closed on replay, governance, constitutional, operator, and duplicate violations", () => {
    for (const scenario of ["REPLAY_DIVERGENCE", "GOVERNANCE_REVIEW_REQUIRED", "CONSTITUTIONAL_VIOLATION", "OPERATOR_APPROVAL_REQUIRED", "DUPLICATE_NOT_CONSOLIDATED"] as const) {
      const result = qualifyPersistentKnowledge({ scenario });

      expect(result.certification.eligible_for_persistence).toBe(false);
      expect(result.certification.failures).toContain(scenario);
      expect(validatePersistentKnowledgeQualification(result).valid).toBe(false);
    }
  });
});
