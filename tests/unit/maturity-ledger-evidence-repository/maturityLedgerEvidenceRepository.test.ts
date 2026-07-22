import { describe, expect, it } from "vitest";
import {
  buildMaturityLedgerEvidenceRepository,
  buildMaturityLedgerObservabilitySurface,
  getMaturityLedgerEvidenceRepositoryBundle,
  getMaturityLedgerIndexes,
  listMaturityLedgerEvidence,
  listMaturityLedgerLineage,
  listMaturityLedgerReplay,
  validateMaturityLedgerEvidenceRepository,
} from "@/services/maturity-ledger-evidence-repository";
import type { MaturityLedgerFailure, MaturityLedgerScenario } from "@/types/maturity-ledger-evidence-repository";

describe("maturity ledger evidence repository", () => {
  it("publishes the immutable append-only repository bundle", () => {
    const bundle = getMaturityLedgerEvidenceRepositoryBundle();

    expect(bundle.doctrine.engine_version).toBe("maturity-ledger-evidence-repository/v8ALT.11.8");
    expect(bundle.doctrine.final_state).toBe("MATURITY_LEDGER_REPOSITORY_READY");
    expect(bundle.repository.final_state).toBe("MATURITY_LEDGER_REPOSITORY_COMPLETE");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.repository.append_only).toBe(true);
    expect(bundle.repository.immutable).toBe(true);
    expect(bundle.repository.mutation_authorized).toBe(false);
    expect(bundle.repository.repository_administration_mutation_authorized).toBe(false);
  });

  it("persists assessment, evidence, lineage, replay, integrity, and indexes", () => {
    const repository = buildMaturityLedgerEvidenceRepository();

    expect(repository.assessment_ledger).toHaveLength(1);
    expect(repository.domain_scores).toHaveLength(10);
    expect(repository.evidence_repository).toHaveLength(6);
    expect(repository.lineage_store).toHaveLength(5);
    expect(repository.replay_repository).toHaveLength(1);
    expect(repository.integrity_records).toHaveLength(1);
    expect(repository.indexes.assessment_index).toHaveLength(1);
    expect(repository.failures).toEqual([]);
  });

  it("keeps domain scores canonical and runtime evidence mapped to existing domains", () => {
    const repository = buildMaturityLedgerEvidenceRepository();
    const domains = repository.domain_scores.map((score) => score.domain);

    expect(domains).toEqual([
      "CONSTITUTIONAL_COMPLIANCE",
      "GOVERNANCE_COMPLIANCE",
      "AUTHORITY_ENFORCEMENT",
      "PLANNING_INTELLIGENCE",
      "EXECUTION_INTELLIGENCE",
      "REPLAY_INTEGRITY",
      "EXPLAINABILITY",
      "RESILIENCE",
      "VISIBILITY",
      "CERTIFICATION_READINESS",
    ]);
    expect(domains).not.toContain("RUNTIME_ASSURANCE");
    expect(repository.evidence_repository.some((entry) => entry.evidence_type === "RUNTIME" && entry.originating_domain === "RESILIENCE")).toBe(true);
  });

  it("keeps repository construction deterministic and exposes slices", () => {
    const first = buildMaturityLedgerEvidenceRepository();
    const second = buildMaturityLedgerEvidenceRepository();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.indexes.integrity_hash).toBe(first.indexes.integrity_hash);
    expect(listMaturityLedgerEvidence()).toHaveLength(6);
    expect(listMaturityLedgerLineage()).toHaveLength(5);
    expect(listMaturityLedgerReplay()).toHaveLength(1);
    expect(getMaturityLedgerIndexes().domain_index).toHaveLength(10);
  });

  it.each([
    ["LEDGER_ENTRY_MODIFICATION", "LEDGER_ENTRY_MODIFIED"],
    ["MISSING_EVIDENCE", "EVIDENCE_MISSING"],
    ["INCOMPLETE_REPLAY_REFERENCES", "REPLAY_REFERENCES_INCOMPLETE"],
    ["BROKEN_LINEAGE", "LINEAGE_RELATIONSHIPS_BROKEN"],
    ["INTEGRITY_VERIFICATION_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["DUPLICATE_ASSESSMENT_IDENTIFIERS", "DUPLICATE_ASSESSMENT_IDENTIFIERS_EXIST"],
    ["REPLAY_RECONSTRUCTION_MISMATCH", "REPLAY_RECONSTRUCTION_MISMATCHED"],
    ["MISSING_GOVERNANCE_EVIDENCE", "GOVERNANCE_EVIDENCE_MISSING"],
    ["MISSING_CONSTITUTIONAL_EVIDENCE", "CONSTITUTIONAL_EVIDENCE_MISSING"],
    ["HIDDEN_LEDGER_ENTRIES", "HIDDEN_LEDGER_ENTRIES_DETECTED"],
    ["TENANT_ISOLATION_VIOLATION", "TENANT_ISOLATION_VIOLATED"],
    ["APPEND_ONLY_COMPROMISE", "APPEND_ONLY_BEHAVIOR_COMPROMISED"],
  ] satisfies [MaturityLedgerScenario, MaturityLedgerFailure][])("invalidates %s", (scenario, failure) => {
    const repository = buildMaturityLedgerEvidenceRepository({ scenario });
    const validation = validateMaturityLedgerEvidenceRepository(repository);

    expect(repository.final_state).toBe("MATURITY_LEDGER_REPOSITORY_FAILED");
    expect(repository.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(repository.mutation_authorized).toBe(false);
    expect(repository.repository_administration_mutation_authorized).toBe(false);
  });

  it("reports failure-specific validation gates", () => {
    expect(validateMaturityLedgerEvidenceRepository(buildMaturityLedgerEvidenceRepository({ scenario: "LEDGER_ENTRY_MODIFICATION" })).ledger_immutable).toBe(false);
    expect(validateMaturityLedgerEvidenceRepository(buildMaturityLedgerEvidenceRepository({ scenario: "MISSING_EVIDENCE" })).evidence_complete).toBe(false);
    expect(validateMaturityLedgerEvidenceRepository(buildMaturityLedgerEvidenceRepository({ scenario: "INCOMPLETE_REPLAY_REFERENCES" })).replay_references_complete).toBe(false);
    expect(validateMaturityLedgerEvidenceRepository(buildMaturityLedgerEvidenceRepository({ scenario: "BROKEN_LINEAGE" })).lineage_intact).toBe(false);
    expect(validateMaturityLedgerEvidenceRepository(buildMaturityLedgerEvidenceRepository({ scenario: "DUPLICATE_ASSESSMENT_IDENTIFIERS" })).identifiers_unique).toBe(false);
    expect(validateMaturityLedgerEvidenceRepository(buildMaturityLedgerEvidenceRepository({ scenario: "MISSING_GOVERNANCE_EVIDENCE" })).governance_evidence_present).toBe(false);
    expect(validateMaturityLedgerEvidenceRepository(buildMaturityLedgerEvidenceRepository({ scenario: "MISSING_CONSTITUTIONAL_EVIDENCE" })).constitutional_evidence_present).toBe(false);
    expect(validateMaturityLedgerEvidenceRepository(buildMaturityLedgerEvidenceRepository({ scenario: "APPEND_ONLY_COMPROMISE" })).append_only).toBe(false);
  });

  it("publishes observability for immutable repository state", () => {
    const surface = buildMaturityLedgerObservabilitySurface(buildMaturityLedgerEvidenceRepository({ scenario: "MISSING_EVIDENCE" }));

    expect(surface.final_state).toBe("MATURITY_LEDGER_REPOSITORY_FAILED");
    expect(surface.assessment_count).toBe(1);
    expect(surface.domain_score_count).toBe(10);
    expect(surface.evidence_count).toBe(0);
    expect(surface.lineage_count).toBe(5);
    expect(surface.replay_count).toBe(1);
    expect(surface.failure_count).toBeGreaterThan(0);
    expect(surface.append_only).toBe(true);
    expect(surface.immutable).toBe(true);
  });
});
