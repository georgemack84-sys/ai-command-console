import { describe, expect, it } from "vitest";
import {
  getSyntheticValidationFoundationBundle,
  replaySyntheticValidationFoundation,
  runSyntheticValidationFoundation,
  validateSyntheticValidationFoundation,
} from "@/services/synthetic-validation-foundation";
import type { SyntheticValidationFailure } from "@/types/synthetic-validation-foundation";

describe("Mission Control Phase 14.1 Synthetic Validation Foundation", () => {
  it("publishes the constitutional root contract for Phase 14", () => {
    const bundle = getSyntheticValidationFoundationBundle();

    expect(bundle.doctrine.version).toBe("synthetic-validation-foundation/v14.1");
    expect(bundle.doctrine.constitutional_root_for_phase_14).toBe(true);
    expect(bundle.doctrine.advisory_only_boundary_immutable).toBe(true);
    expect(bundle.doctrine.deterministic_lifecycle_required).toBe(true);
    expect(bundle.doctrine.immutable_identity_required).toBe(true);
    expect(bundle.doctrine.replay_required_before_archive).toBe(true);
    expect(bundle.doctrine.foundation_for).toHaveLength(13);
    expect(bundle.validation.valid).toBe(true);
  });

  it("enforces advisory-only constitutional supremacy", () => {
    const result = runSyntheticValidationFoundation();

    expect(result.contract.constitutional_authority_order).toEqual(["CONSTITUTION", "GOVERNANCE_AUTHORITY", "OPERATOR_AUTHORITY", "SYNTHETIC_VALIDATION"]);
    expect(result.contract.advisory_only).toBe(true);
    expect(result.contract.operational_execution_allowed).toBe(false);
    expect(result.advisory_constraints).toEqual([
      "never authorize execution",
      "never deploy software",
      "never modify operational systems",
      "never bypass governance",
      "never override operator decisions",
      "never expand authority",
      "never initiate external actions",
      "never mutate production state",
    ]);
  });

  it("defines the deterministic validation lifecycle", () => {
    const result = runSyntheticValidationFoundation();

    expect(result.lifecycle.states).toEqual(["REGISTERED", "CONFIGURED", "VALIDATED", "AUTHORIZED", "EXECUTING", "COMPLETED", "REPLAYABLE", "ARCHIVED"]);
    expect(result.lifecycle.transition_order).toEqual(result.lifecycle.states);
    expect(result.lifecycle.cannot_skip_stages).toBe(true);
    expect(result.lifecycle.cannot_regress_without_governed_replay).toBe(true);
    expect(result.lifecycle.cannot_execute_before_authorization).toBe(true);
    expect(result.lifecycle.completed_results_immutable).toBe(true);
    expect(result.lifecycle.archive_requires_replay_certification).toBe(true);
    expect(result.lifecycle.invalid_transitions).toEqual([]);
  });

  it("registers canonical scope and immutable identity", () => {
    const result = runSyntheticValidationFoundation({ tenant_id: "tenant_alpha", validation_scope: "ADVERSARIAL_VALIDATION", owner: "owner_alpha" });

    expect(result.registry_entry.validation_type).toBe("SYNTHETIC_VALIDATION");
    expect(result.registry_entry.tenant_id).toBe("tenant_alpha");
    expect(result.registry_entry.validation_scope).toBe("ADVERSARIAL_VALIDATION");
    expect(result.identity_record.validation_id).toBe(result.registry_entry.validation_id);
    expect(result.identity_record.tenant_id).toBe(result.registry_entry.tenant_id);
    expect(result.identity_record.owner).toBe(result.registry_entry.owner);
    expect(result.identity_record.policy_manifest_ref).toBe(result.registry_entry.policy_manifest_ref);
    expect(result.identity_record.governance_context_ref).toBe(result.registry_entry.governance_scope);
    expect(result.identity_record.lineage_ref).toBeTruthy();
    expect(result.identity_record.replay_package_ref).toBeTruthy();
  });

  it("is deterministic and replayable for identical inputs", () => {
    const first = runSyntheticValidationFoundation();
    const second = runSyntheticValidationFoundation();

    expect(first.outcome).toBe("APPROVED");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateSyntheticValidationFoundation(first).valid).toBe(true);
    expect(replaySyntheticValidationFoundation(first)).toBe(true);
  });

  it("preserves replay obligations", () => {
    const result = runSyntheticValidationFoundation();

    expect(result.replay.preserves_configuration).toBe(true);
    expect(result.replay.preserves_execution_ordering).toBe(true);
    expect(result.replay.preserves_dependency_graph).toBe(true);
    expect(result.replay.preserves_governance_decisions).toBe(true);
    expect(result.replay.preserves_policy_manifest).toBe(true);
    expect(result.replay.preserves_evidence_inputs).toBe(true);
    expect(result.replay.preserves_outputs).toBe(true);
    expect(result.replay.preserves_integrity_verification).toBe(true);
    expect(result.replay.preserves_lifecycle_transitions).toBe(true);
    expect(result.replay.preserves_audit_history).toBe(true);
    expect(result.replay.reproducible).toBe(true);
  });

  it.each([
    "ADVISORY_BOUNDARY_BREACH",
    "AUTHORITY_HIERARCHY_BREACH",
    "NON_DETERMINISTIC_EXECUTION",
    "REPLAY_PACKAGE_INCOMPLETE",
    "GOVERNANCE_NOT_APPROVED",
    "TENANT_ISOLATION_BREACH",
    "INVALID_LIFECYCLE_TRANSITION",
    "MISSING_POLICY_MANIFEST",
    "MISSING_GOVERNANCE_CONTEXT",
    "IDENTITY_MUTATION",
    "LINEAGE_INCOMPLETE",
    "AUDIT_INCOMPLETE",
    "UNAUTHORIZED_OPERATIONAL_ACTION",
  ] as const)("rejects %s fail-closed", (scenario: SyntheticValidationFailure) => {
    const result = runSyntheticValidationFoundation({ scenario });
    const validation = validateSyntheticValidationFoundation(result);

    expect(result.outcome).toBe("REJECTED");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested identity tampering", () => {
    const result = runSyntheticValidationFoundation();
    const tampered = {
      ...result,
      identity_record: {
        ...result.identity_record,
        owner: "replacement-owner",
      },
    };

    expect(validateSyntheticValidationFoundation(tampered).valid).toBe(false);
  });
});
