import { describe, expect, it } from "vitest";
import {
  buildAutonomousKnowledgeCertificationDashboard,
  certifyAutonomousKnowledgeEvolution,
  getAutonomousKnowledgeEvolutionCertificationGate,
  listAutonomousKnowledgeCertificationFailures,
  listAutonomousKnowledgeCertificationLedger,
  listAutonomousKnowledgeCertificationMatrix,
  listAutonomousKnowledgeCertificationReports,
  validateAutonomousKnowledgeCertification,
} from "@/services/autonomous-knowledge-evolution-certification-gate";
import type { AutonomousKnowledgeCertificationFailure, AutonomousKnowledgeCertificationScenario } from "@/types/autonomous-knowledge-evolution-certification-gate";

describe("autonomous knowledge evolution certification gate", () => {
  it("publishes the deterministic certification gate bundle", () => {
    const bundle = getAutonomousKnowledgeEvolutionCertificationGate();

    expect(bundle.doctrine.engine_version).toBe("autonomous-knowledge-evolution-certification-gate/v8ALT.9.11");
    expect(bundle.doctrine.final_state).toBe("AUTONOMOUS_KNOWLEDGE_EVOLUTION_CERTIFICATION_READY");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.certification.certification_only).toBe(true);
    expect(bundle.certification.production_authorization_granted).toBe(false);
    expect(bundle.certification.activation_authorized).toBe(false);
    expect(bundle.certification.runtime_modification_authorized).toBe(false);
  });

  it("returns conditional pass while preview-only phases remain pending", () => {
    const certification = certifyAutonomousKnowledgeEvolution();

    expect(certification.certification_state).toBe("CONDITIONAL_PASS");
    expect(certification.automatic_failures).toEqual([]);
    expect(certification.matrix.some((item) => item.actual_status === "CONDITIONAL_PASS")).toBe(true);
    expect(certification.required_actions).toContain("Implement Phase 8ALT.9.5 confidence calibration evolution.");
    expect(certification.production_authorization_granted).toBe(false);
  });

  it("lists matrix, failures, reports, ledger, and dashboard read models", () => {
    expect(listAutonomousKnowledgeCertificationMatrix().length).toBeGreaterThan(0);
    expect(listAutonomousKnowledgeCertificationFailures()).toEqual([]);
    expect(listAutonomousKnowledgeCertificationReports().length).toBeGreaterThan(0);
    expect(listAutonomousKnowledgeCertificationLedger().length).toBeGreaterThan(0);

    const dashboard = buildAutonomousKnowledgeCertificationDashboard();
    expect(dashboard.certification_state).toBe("CONDITIONAL_PASS");
    expect(dashboard.production_authorization_granted).toBe(false);
    expect(dashboard.activation_authorized).toBe(false);
  });

  it("is deterministic for identical certification inputs", () => {
    const first = certifyAutonomousKnowledgeEvolution();
    const second = certifyAutonomousKnowledgeEvolution();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.matrix.map((item) => item.test_id)).toEqual(first.matrix.map((item) => item.test_id));
    expect(second.ledger_entries.map((entry) => entry.ledger_entry_id)).toEqual(first.ledger_entries.map((entry) => entry.ledger_entry_id));
  });

  it("keeps certification-only records non-authorizing", () => {
    const certification = certifyAutonomousKnowledgeEvolution();
    const validation = validateAutonomousKnowledgeCertification(certification);

    expect(validation.certification_only).toBe(true);
    expect(validation.production_authorization_granted).toBe(false);
    expect(validation.activation_authorized).toBe(false);
    expect(validation.pass_or_conditional).toBe(true);
    expect(validation.automatic_failures_absent).toBe(true);
    expect(certification.governance_modification_authorized).toBe(false);
  });

  it.each([
    ["NONDETERMINISTIC_LEARNING", "NONDETERMINISTIC_LEARNING"],
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH"],
    ["HISTORICAL_TRUTH_MODIFIED", "HISTORICAL_TRUTH_MODIFIED"],
    ["CONSTITUTION_MODIFIED", "CONSTITUTION_MODIFIED"],
    ["GOVERNANCE_RULES_MODIFIED", "GOVERNANCE_RULES_MODIFIED"],
    ["AUTHORITY_POLICIES_MODIFIED", "AUTHORITY_POLICIES_MODIFIED"],
    ["AUTONOMOUS_ACTIVATION", "AUTONOMOUS_ACTIVATION"],
    ["OPERATOR_APPROVAL_BYPASSED", "OPERATOR_APPROVAL_BYPASSED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS"],
    ["CONSTITUTIONAL_BYPASS", "CONSTITUTIONAL_BYPASS"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION"],
    ["CROSS_TENANT_LEAKAGE", "CROSS_TENANT_LEAKAGE"],
    ["CROSS_TENANT_REPLAY_ACCESS", "CROSS_TENANT_REPLAY_ACCESS"],
    ["MISSING_EVIDENCE_LINEAGE", "MISSING_EVIDENCE_LINEAGE"],
    ["MISSING_REPLAY_REFERENCES", "MISSING_REPLAY_REFERENCES"],
    ["BROKEN_VERSION_HISTORY", "BROKEN_VERSION_HISTORY"],
    ["INTEGRITY_FAILURE", "INTEGRITY_FAILURE"],
    ["HASH_MISMATCH", "HASH_MISMATCH"],
    ["DIGITAL_SIGNATURE_INVALID", "DIGITAL_SIGNATURE_INVALID"],
    ["INCOMPLETE_EXPLAINABILITY", "INCOMPLETE_EXPLAINABILITY"],
    ["HIDDEN_LEARNING_BEHAVIOR", "HIDDEN_LEARNING_BEHAVIOR"],
    ["HIDDEN_ACTIVATION", "HIDDEN_ACTIVATION"],
    ["REPOSITORY_MUTATION", "REPOSITORY_MUTATION"],
    ["LEDGER_OVERWRITE", "LEDGER_OVERWRITE"],
    ["AUDIT_HISTORY_MODIFIED", "AUDIT_HISTORY_MODIFIED"],
    ["NONDETERMINISTIC_CERTIFICATION_REPORT", "NONDETERMINISTIC_CERTIFICATION_REPORT"],
  ] satisfies [AutonomousKnowledgeCertificationScenario, AutonomousKnowledgeCertificationFailure][])("fails immediately on %s", (scenario, failure) => {
    const certification = certifyAutonomousKnowledgeEvolution({ scenario });
    const validation = validateAutonomousKnowledgeCertification(certification);

    expect(certification.certification_state).toBe("FAIL");
    expect(certification.automatic_failures).toContain(failure);
    expect(certification.matrix.every((item) => item.actual_status === "FAIL")).toBe(true);
    expect(validation.valid).toBe(false);
    expect(validation.fail_closed).toBe(true);
    expect(validation.failures).toContain(failure);
    expect(certification.production_authorization_granted).toBe(false);
  });

  it("publishes immutable append-only certification ledger entries", () => {
    const certification = certifyAutonomousKnowledgeEvolution();

    expect(certification.ledger_entries.length).toBe(certification.matrix.length + 2);
    expect(certification.ledger_entries.every((entry) => entry.immutable && entry.append_only)).toBe(true);
    expect(certification.ledger_entries.at(0)?.event_type).toBe("CERTIFICATION_STARTED");
    expect(certification.ledger_entries.at(-1)?.event_type).toBe("CERTIFICATION_DECIDED");
  });
});
