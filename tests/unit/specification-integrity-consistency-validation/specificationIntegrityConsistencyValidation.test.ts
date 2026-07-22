import { describe, expect, it } from "vitest";
import {
  getSpecificationIntegrityConsistencyValidationBundle,
  replaySpecificationIntegrityConsistencyValidation,
  runSpecificationIntegrityConsistencyValidation,
  validateSpecificationIntegrityConsistencyValidation,
} from "@/services/specification-integrity-consistency-validation";
import type { SpecificationIntegrityScenario } from "@/types/specification-integrity-consistency-validation";

describe("Mission Control Phase 13.11 Specification Integrity & Consistency Validation", () => {
  it("publishes integrity validation doctrine", () => {
    const bundle = getSpecificationIntegrityConsistencyValidationBundle();

    expect(bundle.doctrine.version).toBe("specification-integrity-consistency-validation/v13.11");
    expect(bundle.doctrine.validation_states).toEqual(["NOT_VALIDATED", "VALIDATING", "VALID", "INVALID", "REQUIRES_RECONCILIATION"]);
    expect(bundle.doctrine.validation_domains).toContain("vocabulary");
    expect(bundle.doctrine.validation_domains).toContain("document_taxonomy");
    expect(bundle.doctrine.reconciliation_required_for_conflicts).toBe(true);
    expect(bundle.doctrine.mission_control_change_authority).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("creates deterministic integrity records", () => {
    const first = runSpecificationIntegrityConsistencyValidation();
    const second = runSpecificationIntegrityConsistencyValidation();

    expect(first.contract.integrity_status).toBe("VALID");
    expect(first.contract.validator_version).toBe("specification-integrity-consistency-validation/v13.11");
    expect(first.contract.evidence_refs).toHaveLength(3);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateSpecificationIntegrityConsistencyValidation(first).valid).toBe(true);
    expect(replaySpecificationIntegrityConsistencyValidation(first)).toBe(true);
  });

  it("validates every required consistency domain", () => {
    const result = runSpecificationIntegrityConsistencyValidation();
    const reports = [
      result.vocabulary_validation,
      result.cross_reference_validation,
      result.semantic_integrity,
      result.constitutional_consistency,
      result.lifecycle_consistency,
      result.dependency_consistency,
      result.replay_certification_consistency,
      result.document_taxonomy_consistency,
    ];

    expect(reports.map((item) => item.outcome)).toEqual(Array(8).fill("PASS"));
    expect(reports.every((item) => item.deterministic && item.evidence_refs.length === 3)).toBe(true);
    expect(result.constitutional_consistency.checked_items).toContain("authority ceilings");
    expect(result.replay_certification_consistency.checked_items).toContain("certification rules");
    expect(result.document_taxonomy_consistency.checked_items).toContain("addenda");
  });

  it("preserves integrity registry and immutable ledger history", () => {
    const result = runSpecificationIntegrityConsistencyValidation();

    expect(result.integrity_registry.immutable).toBe(true);
    expect(result.integrity_registry.historical_integrity_replayable).toBe(true);
    expect(result.integrity_registry.validator_versions).toContain("specification-integrity-consistency-validation/v13.11");
    expect(result.integrity_ledger).toHaveLength(8);
    expect(result.integrity_ledger.every((entry, index) => entry.sequence === index + 1 && entry.append_only && entry.immutable && entry.replayable)).toBe(true);
  });

  it.each([
    "SEMANTIC_CONTRADICTION",
    "DOCUMENT_TAXONOMY_CONFLICT",
    "DEPENDENCY_UNRESOLVED",
    "CERTIFICATION_CONFLICT",
  ] as const)("requires reconciliation for %s", (scenario: SpecificationIntegrityScenario) => {
    const result = runSpecificationIntegrityConsistencyValidation({ scenario });
    const validation = validateSpecificationIntegrityConsistencyValidation(result);

    expect(result.contract.integrity_status).toBe("REQUIRES_RECONCILIATION");
    expect(result.contract.certification_status).toBe("REQUIRES_RECONCILIATION");
    expect(result.contract.detected_inconsistencies).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it.each([
    "VOCABULARY_DRIFT",
    "DUPLICATE_DEFINITION",
    "UNDEFINED_TERMINOLOGY",
    "BROKEN_REFERENCE",
    "CIRCULAR_REFERENCE_UNGOVERNED",
    "AUTHORITY_EXPANSION",
    "LIFECYCLE_AMBIGUITY",
    "REPLAY_INCONSISTENT",
    "LINEAGE_INCOMPLETE",
    "AMENDMENT_INCONSISTENT",
    "ADDENDUM_INVALIDATES_BEHAVIOR",
    "AUDIT_LEDGER_MUTABLE",
  ] as const)("fails integrity validation for %s", (scenario: SpecificationIntegrityScenario) => {
    const result = runSpecificationIntegrityConsistencyValidation({ scenario });
    const validation = validateSpecificationIntegrityConsistencyValidation(result);

    expect(result.contract.integrity_status).toBe("INVALID");
    expect(result.contract.detected_inconsistencies).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested ledger tampering", () => {
    const result = runSpecificationIntegrityConsistencyValidation();
    const tampered = {
      ...result,
      integrity_ledger: [
        {
          ...result.integrity_ledger[0],
          event_type: "REPLAY_IMPACT" as const,
        },
        ...result.integrity_ledger.slice(1),
      ],
    };

    expect(validateSpecificationIntegrityConsistencyValidation(tampered).valid).toBe(false);
  });
});
