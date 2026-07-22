import { describe, expect, it } from "vitest";
import {
  getAssuranceAuditLineageIntegrityBundle,
  replayAssuranceAuditLineageIntegrity,
  runAssuranceAuditLineageIntegrity,
  validateAssuranceAuditLineageIntegrity,
} from "@/services/assurance-audit-lineage-integrity";
import type { AssuranceAuditScenario } from "@/types/assurance-audit-lineage-integrity";

describe("Mission Control Phase 13.7 Assurance Audit, Lineage & Integrity", () => {
  it("publishes the assurance audit doctrine and canonical audit contract", () => {
    const bundle = getAssuranceAuditLineageIntegrityBundle();
    const audit = bundle.result.audit_contract;

    expect(bundle.doctrine.version).toBe("assurance-audit-lineage-integrity/v13.7");
    expect(bundle.doctrine.immutable_lineage_required).toBe(true);
    expect(bundle.doctrine.integrity_verification_required).toBe(true);
    expect(bundle.doctrine.audit_ledger_append_only).toBe(true);
    expect(bundle.doctrine.replay_trace_required).toBe(true);
    expect(bundle.doctrine.amendment_traceability_required).toBe(true);
    expect(bundle.doctrine.completeness_required_before_certification).toBe(true);
    expect(audit.audit_id).toMatch(/^assurance_audit_/);
    expect(audit.replay_refs.length).toBeGreaterThan(0);
    expect(audit.lineage_root).toMatch(/^lineage_root_/);
    expect(audit.audit_status).toBe("COMPLETE");
  });

  it("constructs deterministic audit artifacts with stable hashes", () => {
    const first = runAssuranceAuditLineageIntegrity();
    const second = runAssuranceAuditLineageIntegrity();

    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.audit_contract.integrity_hash).toBe(second.audit_contract.integrity_hash);
    expect(first.lineage_graph.integrity_hash).toBe(second.lineage_graph.integrity_hash);
    expect(first.audit_ledger.map((entry) => entry.integrity_hash)).toEqual(second.audit_ledger.map((entry) => entry.integrity_hash));
    expect(validateAssuranceAuditLineageIntegrity(first).valid).toBe(true);
    expect(replayAssuranceAuditLineageIntegrity(first)).toBe(true);
  });

  it("builds complete immutable lineage and provenance", () => {
    const result = runAssuranceAuditLineageIntegrity();

    expect(result.lineage_graph.complete).toBe(true);
    expect(result.lineage_graph.deterministic).toBe(true);
    expect(result.lineage_graph.replayable).toBe(true);
    expect(result.lineage_graph.immutable).toBe(true);
    expect(result.lineage_graph.append_only).toBe(true);
    expect(result.lineage_graph.nodes.every((node) => node.origin_ref === result.audit_contract.lineage_root)).toBe(true);
    expect(result.provenance_service.every((chain) => chain.canonical && chain.complete && chain.immutable && chain.replayable)).toBe(true);
  });

  it("verifies assurance integrity before certification", () => {
    const result = runAssuranceAuditLineageIntegrity();
    const integrity = result.integrity_validation;

    expect(integrity.artifact_hashes).toBe("VERIFIED");
    expect(integrity.evidence_hashes).toBe("VERIFIED");
    expect(integrity.lineage_integrity).toBe("VERIFIED");
    expect(integrity.dependency_integrity).toBe("VERIFIED");
    expect(integrity.replay_integrity).toBe("VERIFIED");
    expect(integrity.certification_integrity).toBe("VERIFIED");
    expect(integrity.amendment_integrity).toBe("VERIFIED");
    expect(integrity.ledger_integrity).toBe("VERIFIED");
    expect(integrity.mandatory_before_certification).toBe(true);
    expect(integrity.constitutional_assurance_event).toBe(false);
  });

  it("records append-only audit history, replay traces, and amendments", () => {
    const result = runAssuranceAuditLineageIntegrity();

    expect(result.audit_ledger).toHaveLength(10);
    expect(result.audit_ledger.every((entry, index) => entry.sequence === index + 1 && entry.append_only && entry.immutable)).toBe(true);
    expect(result.replay_trace_registry).toHaveLength(1);
    expect(result.replay_trace_registry[0].originating_assessment_id).toBe(result.audit_contract.assessment_id);
    expect(result.replay_trace_registry[0].immutable).toBe(true);
    expect(result.amendment_reference_registry).toHaveLength(1);
    expect(result.amendment_reference_registry[0].historical_applicability_preserved).toBe(true);
    expect(result.amendment_reference_registry[0].constitutional_provenance_explicit).toBe(true);
  });

  it("reconstructs identical lineage history and permits certification only when complete", () => {
    const result = runAssuranceAuditLineageIntegrity();

    expect(result.lineage_replay.identical_to_original).toBe(true);
    expect(result.lineage_replay.missing_lineage_detected).toBe(false);
    expect(result.completeness_validation.outcome).toBe("COMPLETE");
    expect(result.completeness_validation.certification_prohibited).toBe(false);
    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.certification_authorized).toBe(true);
  });

  it.each([
    "LINEAGE_MISSING",
    "LINEAGE_MUTATED",
    "ARTIFACT_HASH_MODIFIED",
    "EVIDENCE_HASH_MISSING",
    "DEPENDENCY_INTEGRITY_INVALID",
    "REPLAY_TRACE_MISSING",
    "DIVERGENCE_REFERENCE_MISSING",
    "CERTIFICATION_REFERENCE_MISSING",
    "AMENDMENT_REFERENCE_MISSING",
    "LEDGER_MUTATION_ATTEMPT",
    "PROVENANCE_CHAIN_INCOMPLETE",
    "REPLAY_RECONSTRUCTION_MISMATCH",
    "AUDIT_COMPLETENESS_INCOMPLETE",
  ] as const)("fails closed for %s", (scenario: AssuranceAuditScenario) => {
    const result = runAssuranceAuditLineageIntegrity({ scenario });
    const validation = validateAssuranceAuditLineageIntegrity(result);

    expect(result.certification.outcome).toBe("NON_PASSING");
    expect(result.certification.certification_authorized).toBe(false);
    expect(result.completeness_validation.certification_prohibited).toBe(true);
    expect(result.certification.failures).toContain(scenario === "AUDIT_COMPLETENESS_INCOMPLETE" ? "AUDIT_COMPLETENESS_INCOMPLETE" : scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested audit tampering", () => {
    const result = runAssuranceAuditLineageIntegrity();
    const tampered = {
      ...result,
      audit_ledger: [
        {
          ...result.audit_ledger[0],
          artifact_ref: "tampered-artifact",
        },
        ...result.audit_ledger.slice(1),
      ],
    };

    expect(validateAssuranceAuditLineageIntegrity(tampered).valid).toBe(false);
  });
});
