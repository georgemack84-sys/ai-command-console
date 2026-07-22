import { describe, expect, it } from "vitest";
import {
  TRUTH_BINDING_CHECKS,
  computeOutcomeTruthBindingHash,
  getTruthLedgerBindingEngineFoundation,
  replayTruthLedgerBindingEngine,
  runTruthLedgerBindingEngine,
} from "@/services/truth-ledger-binding-engine";
import type { TruthBindingFailure, TruthLedgerBindingEngineInput } from "@/types/truth-ledger-binding-engine";

describe("Mission Control Phase 10.2.3 Truth Ledger Binding Engine", () => {
  it("publishes the truth ledger binding engine foundation", () => {
    const foundation = getTruthLedgerBindingEngineFoundation();

    expect(foundation.truth_ledger_binding_engine_version).toBe("truth-ledger-binding-engine/v1");
    expect(foundation.checks).toEqual(TRUTH_BINDING_CHECKS);
    expect(foundation.api_surface.create_binding).toBe("POST /truth-ledger/bind");
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("creates immutable references only without modifying Truth Ledger records", () => {
    const result = runTruthLedgerBindingEngine();

    expect(result.immutable_references_only).toBe(true);
    expect(result.modifies_truth_ledger_records).toBe(false);
    expect(result.update_supported).toBe(false);
    expect(result.delete_supported).toBe(false);
  });

  it("generates stable binding hashes and replay output", () => {
    const result = runTruthLedgerBindingEngine();

    expect(computeOutcomeTruthBindingHash(result.binding)).toBe(result.binding.integrity_hash);
    expect(replayTruthLedgerBindingEngine(result)).toBe(true);
  });

  it("binds every normalized outcome to mandatory Truth Ledger references", () => {
    const result = runTruthLedgerBindingEngine();
    const binding = result.binding;

    expect(binding.truth_record_refs.length).toBeGreaterThan(0);
    expect(binding.decision_package_ref).toBeTruthy();
    expect(binding.operator_workflow_ref).toBeTruthy();
    expect(binding.evidence_refs.length).toBeGreaterThan(0);
    expect(binding.replay_refs.length).toBeGreaterThan(0);
    expect(binding.governance_refs.length).toBeGreaterThan(0);
    expect(binding.certification_refs.length).toBeGreaterThan(0);
    expect(binding.final_outcome_ref).toBeTruthy();
    expect(binding.historical_truth_chain_refs.length).toBeGreaterThan(0);
  });

  it("creates deterministic reference relationships and append-only registry entries", () => {
    const result = runTruthLedgerBindingEngine();

    expect(result.references.length).toBeGreaterThan(0);
    expect(result.references.every((ref) => ref.immutable_target)).toBe(true);
    expect(result.reference_registry).toHaveLength(1);
    expect(result.reference_registry[0].append_only).toBe(true);
    expect(result.reference_registry[0].deleted).toBe(false);
  });

  it("exposes deterministic binding APIs without update or delete", () => {
    const api = runTruthLedgerBindingEngine().api_surface;

    expect(api.validate_binding).toBe("POST /truth-ledger/bind/validate");
    expect(api.retrieve_binding).toBe("GET /truth-ledger/bind/{binding_id}");
    expect(api.retrieve_truth_references).toBe("GET /truth-ledger/references/{normalized_outcome_id}");
    expect(api.retrieve_historical_truth_chain).toBe("GET /truth-ledger/history/{normalized_outcome_id}");
    expect(api.update_supported).toBe(false);
    expect(api.delete_supported).toBe(false);
  });

  it("publishes advisory-only metrics", () => {
    const result = runTruthLedgerBindingEngine();

    expect(result.metrics.bindings_created).toBe(1);
    expect(result.metrics.registry_growth).toBe(1);
    expect(result.metrics.binding_failures).toBe(0);
    expect(result.metrics.advisory_only).toBe(true);
  });

  it("reconstructs identical binding metadata during replay", () => {
    const result = runTruthLedgerBindingEngine();

    expect(result.replay_metadata.binding_hash).toBe(result.binding.integrity_hash);
    expect(result.replay_metadata.reference_hashes.length).toBe(result.references.length);
    expect(result.replay_metadata.replay_reconstruction_identical).toBe(true);
  });

  it.each([
    ["INVALID_IDENTITY", "IDENTITY_NOT_VALIDATED"],
    ["INCOMPLETE_OUTCOME", "INCOMPLETE_OUTCOME_REJECTED"],
    ["MISSING_IDENTIFIER", "MISSING_IDENTIFIER_REJECTED"],
    ["UNNORMALIZED_RECORD", "UNNORMALIZED_RECORD_REJECTED"],
    ["INVALID_TENANT", "INVALID_TENANT_REJECTED"],
    ["INVALID_MISSION", "INVALID_MISSION_REJECTED"],
    ["MISSING_DECISION", "MISSING_REQUIRED_REFERENCE_REJECTED"],
    ["MISSING_DECISION_PACKAGE", "MISSING_REQUIRED_REFERENCE_REJECTED"],
    ["MISSING_OPERATOR_WORKFLOW", "MISSING_REQUIRED_REFERENCE_REJECTED"],
    ["MISSING_EVIDENCE", "MISSING_REQUIRED_REFERENCE_REJECTED"],
    ["MISSING_REPLAY", "MISSING_REQUIRED_REFERENCE_REJECTED"],
    ["MISSING_GOVERNANCE", "MISSING_REQUIRED_REFERENCE_REJECTED"],
    ["MISSING_CERTIFICATION", "MISSING_REQUIRED_REFERENCE_REJECTED"],
    ["MISSING_FINAL_OUTCOME", "MISSING_REQUIRED_REFERENCE_REJECTED"],
    ["MISSING_HISTORY", "MISSING_REQUIRED_REFERENCE_REJECTED"],
    ["UNKNOWN_REFERENCE", "UNKNOWN_TRUTH_REFERENCE_REJECTED"],
    ["CROSS_TENANT_REFERENCE", "CROSS_TENANT_REFERENCE_REJECTED"],
    ["MUTABLE_REFERENCE", "MUTABLE_LEDGER_REFERENCE_REJECTED"],
    ["REPLAY_MISMATCH", "REPLAY_REFERENCE_MISMATCH_REJECTED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH_REJECTED"],
    ["APPEND_ONLY_VIOLATION", "REGISTRY_APPEND_ONLY_VIOLATED"],
    ["HISTORICAL_MUTATION", "HISTORICAL_RECORD_MUTATION_REJECTED"],
    ["NONDETERMINISTIC_RELATIONSHIP", "RELATIONSHIP_NONDETERMINISTIC"],
    ["FAIL_OPEN", "FAIL_OPEN_BINDING_BEHAVIOR"],
  ] as readonly [NonNullable<TruthLedgerBindingEngineInput["scenario"]>, TruthBindingFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runTruthLedgerBindingEngine({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.audit_report.certification_decision).toBe("FAIL");
    expect(result.modifies_truth_ledger_records).toBe(false);
  });

  it("fails closed when the role lacks binding visibility", () => {
    const result = runTruthLedgerBindingEngine({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects truth ledger binding tampering during replay", () => {
    const result = runTruthLedgerBindingEngine();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayTruthLedgerBindingEngine(tampered)).toBe(false);
  });
});
