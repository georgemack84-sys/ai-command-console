import { describe, expect, it } from "vitest";

import {
  getKnowledgeLifecycleContract,
  replayKnowledgeLifecycleManagement,
  runKnowledgeLifecycleManagement,
  validateKnowledgeLifecycleManagement,
} from "../../../services/knowledge-lifecycle-management";

describe("knowledge lifecycle management", () => {
  it("runs deterministic certified lifecycle management", () => {
    const first = runKnowledgeLifecycleManagement();
    const second = runKnowledgeLifecycleManagement();

    expect(first.certification.status).toBe("PASS");
    expect(first.certification.production_ready).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateKnowledgeLifecycleManagement(first).valid).toBe(true);
    expect(replayKnowledgeLifecycleManagement(first)).toBe(true);
  });

  it("preserves lifecycle doctrine boundaries", () => {
    const bundle = getKnowledgeLifecycleContract();

    expect(bundle.doctrine.deterministic_lifecycle).toBe(true);
    expect(bundle.doctrine.silent_expiration_supported).toBe(false);
    expect(bundle.doctrine.deletion_supported).toBe(false);
    expect(bundle.doctrine.archive_never_disappears).toBe(true);
    expect(bundle.doctrine.retirement_deletes_history).toBe(false);
  });

  it("progresses through every lifecycle state deterministically", () => {
    const result = runKnowledgeLifecycleManagement();

    expect(result.organizational_learning_certified).toBe(true);
    expect(result.records.map((record) => record.current_state)).toEqual(["OBSERVED", "QUALIFIED", "CERTIFIED", "PERSISTENT", "REFERENCED", "UPDATED", "SUPERSEDED", "ARCHIVED", "RETIRED"]);
    expect(result.transitions.every((transition) => transition.legal && transition.deterministic && transition.replay_validated)).toBe(true);
  });

  it("enforces expiration, supersession, requalification, revocation, and retirement policies", () => {
    const result = runKnowledgeLifecycleManagement();

    expect(result.policies.expiration_review_required).toBe(true);
    expect(result.policies.automatic_delete_supported).toBe(false);
    expect(result.policies.requalification_triggers).toContain("confidence_degradation");
    expect(result.policies.revocation_blocks_retrieval).toBe(true);
    expect(result.policies.retired_preserved_for_audit).toBe(true);
    expect(result.versions.every((version) => version.immutable && version.replayable && version.auditable)).toBe(true);
  });

  it("validates integrity and records append-only lifecycle history", () => {
    const result = runKnowledgeLifecycleManagement();

    expect(result.integrity_report.hash_valid).toBe(true);
    expect(result.integrity_report.lineage_valid).toBe(true);
    expect(result.integrity_report.replay_consistent).toBe(true);
    expect(result.ledger).toHaveLength(8);
    expect(result.ledger.every((entry, index) => entry.append_only && entry.sequence === index + 1)).toBe(true);
  });

  it("runs the lifecycle certification suite", () => {
    const result = runKnowledgeLifecycleManagement();

    expect(result.certification.tests).toHaveLength(34);
    expect(result.certification.tests.every((test) => test.passed)).toBe(true);
  });

  it("fails closed on transition, governance, integrity, replay, tenant, and ledger violations", () => {
    for (const scenario of ["NONDETERMINISTIC_TRANSITION", "GOVERNANCE_APPROVAL_MISSING", "HASH_VALIDATION_FAILED", "REPLAY_VALIDATION_FAILED", "TENANT_ISOLATION_BREACH", "LEDGER_MUTATION"] as const) {
      const result = runKnowledgeLifecycleManagement({ scenario });

      expect(result.certification.status).toBe("FAIL");
      expect(result.certification.production_ready).toBe(false);
      expect(result.certification.failures).toContain(scenario);
      expect(validateKnowledgeLifecycleManagement(result).valid).toBe(false);
    }
  });
});
