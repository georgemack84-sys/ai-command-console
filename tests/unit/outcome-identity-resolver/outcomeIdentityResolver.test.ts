import { describe, expect, it } from "vitest";
import {
  OUTCOME_IDENTITY_CHECKS,
  computeOutcomeIdentityHash,
  getOutcomeIdentityResolverFoundation,
  replayOutcomeIdentityResolver,
  runOutcomeIdentityResolver,
} from "@/services/outcome-identity-resolver";
import type { OutcomeIdentityFailure, OutcomeIdentityResolverInput } from "@/types/outcome-identity-resolver";

describe("Mission Control Phase 10.2.2 Outcome Identity Resolver", () => {
  it("publishes the outcome identity resolver foundation", () => {
    const foundation = getOutcomeIdentityResolverFoundation();

    expect(foundation.outcome_identity_resolver_version).toBe("outcome-identity-resolver/v1");
    expect(foundation.checks).toEqual(OUTCOME_IDENTITY_CHECKS);
    expect(foundation.api_surface.generate_identity).toBe("POST /identity/generate");
    expect(foundation.result.input_validation.validation_status).toBe("VALID");
  });

  it("generates deterministic canonical identities without new meaning or outcome mutation", () => {
    const result = runOutcomeIdentityResolver();

    expect(result.identity_only).toBe(true);
    expect(result.creates_new_meaning).toBe(false);
    expect(result.modifies_outcome_data).toBe(false);
    expect(result.uses_randomness).toBe(false);
    expect(result.outcome_identity.identity_state).toBe("CANONICAL");
  });

  it("creates stable identity hashes and replay output", () => {
    const result = runOutcomeIdentityResolver();

    expect(computeOutcomeIdentityHash(result.outcome_identity)).toBe(result.outcome_identity.integrity_hash);
    expect(replayOutcomeIdentityResolver(result)).toBe(true);
  });

  it("uses only deterministic identity inputs for canonical reference generation", () => {
    const result = runOutcomeIdentityResolver();
    const identity = result.outcome_identity;
    const canonicalAgain = runOutcomeIdentityResolver();

    expect(identity.canonical_identity_id).toBe(canonicalAgain.outcome_identity.canonical_identity_id);
    expect(identity.canonical_reference).toBe(canonicalAgain.outcome_identity.canonical_reference);
    expect(identity.normalization_version).toBe("10.2.1");
    expect(identity.identity_version).toBe("10.2.2");
  });

  it.each([
    ["EXACT_DUPLICATE", "EXACT_DUPLICATE"],
    ["REPLAY_DUPLICATE", "REPLAY_DUPLICATE"],
    ["IMPORT_DUPLICATE", "IMPORT_DUPLICATE"],
  ] as const)("resolves %s to a single canonical identity", (scenario, duplicateReason) => {
    const result = runOutcomeIdentityResolver({ scenario });

    expect(result.outcome_identity.identity_state).toBe("DUPLICATE");
    expect(result.duplicate_resolution.duplicate_reason).toBe(duplicateReason);
    expect(result.duplicate_resolution.canonical_identity_id).toBe(result.outcome_identity.canonical_identity_id);
  });

  it("preserves append-only identity registry and immutable lineage", () => {
    const result = runOutcomeIdentityResolver();

    expect(result.identity_registry).toHaveLength(1);
    expect(result.identity_registry[0].append_only).toBe(true);
    expect(result.identity_registry[0].deleted).toBe(false);
    expect(result.lineage_records.length).toBeGreaterThan(0);
    expect(result.lineage_records[0].lineage_root_id).toBe(result.outcome_identity.lineage_root_id);
  });

  it("provides deterministic identity API metadata", () => {
    const result = runOutcomeIdentityResolver();

    expect(result.api_surface.resolve_identity).toBe("POST /identity/resolve");
    expect(result.api_surface.detect_duplicates).toBe("POST /identity/duplicates");
    expect(result.api_surface.lookup_identity).toBe("GET /identity/{normalized_outcome_id}");
    expect(result.api_surface.retrieve_lineage).toBe("GET /identity/{normalized_outcome_id}/lineage");
    expect(result.api_surface.update_supported).toBe(false);
    expect(result.api_surface.delete_supported).toBe(false);
  });

  it("publishes advisory-only identity metrics", () => {
    const result = runOutcomeIdentityResolver();

    expect(result.metrics.identities_generated).toBe(1);
    expect(result.metrics.registry_growth).toBe(1);
    expect(result.metrics.replay_consistency).toBe(1);
    expect(result.metrics.advisory_only).toBe(true);
  });

  it.each([
    ["MISSING_IDENTIFIER", "MISSING_IDENTIFIERS_REJECTED"],
    ["INVALID_NORMALIZATION_VERSION", "INVALID_NORMALIZATION_VERSION_REJECTED"],
    ["MALFORMED_TIMESTAMP", "MALFORMED_TIMESTAMP_REJECTED"],
    ["INCOMPLETE_OUTCOME_REF", "INCOMPLETE_OUTCOME_REFERENCE_REJECTED"],
    ["CROSS_TENANT_REFERENCE", "CROSS_TENANT_REFERENCE_REJECTED"],
    ["AMBIGUOUS_IDENTITY", "AMBIGUOUS_IDENTITY_REJECTED"],
    ["RANDOM_IDENTITY", "RANDOM_IDENTITY_GENERATION_REJECTED"],
    ["NONDETERMINISTIC_DUPLICATE", "DUPLICATE_RESOLUTION_NONDETERMINISTIC"],
    ["INVALID_DUPLICATE", "INVALID_DUPLICATE_MERGE_REJECTED"],
    ["APPEND_ONLY_VIOLATION", "REGISTRY_APPEND_ONLY_VIOLATED"],
    ["IDENTITY_MUTATION", "CANONICAL_IDENTITY_MUTATION_REJECTED"],
    ["LINEAGE_INCOMPLETE", "LINEAGE_INCOMPLETE"],
    ["REPLAY_MISMATCH", "REPLAY_RECONSTRUCTION_DIFFERED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_NOT_REPRODUCIBLE"],
    ["INVALID_NORMALIZATION", "NORMALIZED_OUTCOME_NOT_VALIDATED"],
    ["FAIL_OPEN", "FAIL_OPEN_IDENTITY_RESOLUTION_BEHAVIOR"],
  ] as readonly [NonNullable<OutcomeIdentityResolverInput["scenario"]>, OutcomeIdentityFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runOutcomeIdentityResolver({ scenario });

    expect(result.input_validation.validation_status).toBe("BLOCKED");
    expect(result.input_validation.failures).toContain(failure);
    expect(result.audit_report.certification_decision).toBe("FAIL");
    expect(result.modifies_outcome_data).toBe(false);
  });

  it("fails closed when the role lacks identity visibility", () => {
    const result = runOutcomeIdentityResolver({ role: "ADMINISTRATOR" });

    expect(result.input_validation.validation_status).toBe("BLOCKED");
    expect(result.input_validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects outcome identity resolver tampering during replay", () => {
    const result = runOutcomeIdentityResolver();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayOutcomeIdentityResolver(tampered)).toBe(false);
  });
});
