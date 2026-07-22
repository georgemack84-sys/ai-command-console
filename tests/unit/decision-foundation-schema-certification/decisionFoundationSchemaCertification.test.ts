import { describe, expect, it } from "vitest";
import {
  FOUNDATION_CERTIFICATION_CHECKS,
  FOUNDATION_SCHEMA_SCOPES,
  computeFoundationSchemaValidationHash,
  getFoundationSchemaCertificationFoundation,
  replayFoundationSchemaCertification,
  runFoundationSchemaCertification,
} from "@/services/decision-foundation-schema-certification";
import type { FoundationSchemaCertificationFailure, FoundationSchemaCertificationInput } from "@/types/decision-foundation-schema-certification";

describe("Mission Control Phase 9.12.2 Foundation & Schema Certification", () => {
  it("publishes the foundation schema certification foundation", () => {
    const foundation = getFoundationSchemaCertificationFoundation();

    expect(foundation.certification_version).toBe("decision-foundation-schema-certification/v1");
    expect(foundation.scopes).toEqual(FOUNDATION_SCHEMA_SCOPES);
    expect(foundation.checks).toEqual(FOUNDATION_CERTIFICATION_CHECKS);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("validates every required Phase 9 foundational schema", () => {
    const result = runFoundationSchemaCertification();

    expect(result.schema_validations).toHaveLength(FOUNDATION_SCHEMA_SCOPES.length);
    expect(result.schema_validations.map((record) => record.schema_scope)).toEqual(FOUNDATION_SCHEMA_SCOPES);
    expect(result.schema_validations.every((record) => computeFoundationSchemaValidationHash(record) === record.integrity_hash)).toBe(true);
    expect(result.schema_validations.every((record) => record.validation_state === "PASS")).toBe(true);
  });

  it("produces contract, version, consistency, and dependency reports", () => {
    const result = runFoundationSchemaCertification();

    expect(result.contract_report.required_attributes_complete).toBe(true);
    expect(result.version_report.backward_compatible).toBe(true);
    expect(result.version_report.forward_compatible).toBe(true);
    expect(result.consistency_report.references_valid).toBe(true);
    expect(result.dependency_report.missing_references).toHaveLength(0);
    expect(result.dependency_report.dependency_order).toEqual(FOUNDATION_SCHEMA_SCOPES);
  });

  it("collects complete evidence and writes immutable certification ledger entries", () => {
    const result = runFoundationSchemaCertification();

    expect(result.evidence_package.complete).toBe(true);
    expect(result.evidence_package.immutable).toBe(true);
    expect(result.foundation_ledger.map((entry) => entry.sequence_number)).toEqual([1, 2, 3, 4]);
    expect(result.foundation_ledger.every((entry) => entry.append_only && !entry.deleted)).toBe(true);
  });

  it("approves the foundation certification report for production readiness", () => {
    const result = runFoundationSchemaCertification();

    expect(result.foundation_report.certification_decision).toBe("PASS");
    expect(result.foundation_report.production_readiness).toBe("READY");
    expect(result.foundation_report.certified_schemas).toHaveLength(FOUNDATION_SCHEMA_SCOPES.length);
    expect(result.validation.deterministic_validation).toBe(true);
    expect(result.validation.integrity_verified).toBe(true);
  });

  it("remains replayable and advisory-only", () => {
    const result = runFoundationSchemaCertification();

    expect(replayFoundationSchemaCertification(result)).toBe(true);
    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_schemas_or_contracts).toBe(false);
    expect(result.execution_authority_granted).toBe(false);
  });

  it.each([
    ["MISSING_SCHEMA", "MISSING_REQUIRED_SCHEMA"],
    ["INVALID_CONTRACT", "INVALID_CONTRACT_DEFINITION"],
    ["INCOMPLETE_FIELDS", "INCOMPLETE_REQUIRED_FIELDS"],
    ["DUPLICATE_IDENTITIES", "DUPLICATE_IDENTITIES"],
    ["CONFLICTING_DEFINITIONS", "CONFLICTING_DEFINITIONS"],
    ["INVALID_LIFECYCLE", "INVALID_LIFECYCLE"],
    ["BROKEN_REFERENCES", "BROKEN_REFERENCES"],
    ["MISSING_REPLAY_METADATA", "MISSING_REPLAY_METADATA"],
    ["MISSING_GOVERNANCE_METADATA", "MISSING_GOVERNANCE_METADATA"],
    ["MISSING_CONSTITUTIONAL_METADATA", "MISSING_CONSTITUTIONAL_METADATA"],
    ["MISSING_AUTHORITY_METADATA", "MISSING_AUTHORITY_METADATA"],
    ["MISSING_TENANT_METADATA", "TENANT_METADATA_MISSING"],
    ["VERSION_INCOMPATIBILITY", "VERSION_INCOMPATIBILITY"],
    ["MIGRATION_INCONSISTENCY", "MIGRATION_INCONSISTENCY"],
    ["REPLAY_INCONSISTENCY", "REPLAY_INCONSISTENCY"],
    ["NONDETERMINISTIC_VALIDATION", "NONDETERMINISTIC_VALIDATION"],
    ["SCHEMA_AMBIGUITY", "SCHEMA_AMBIGUITY"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["FAIL_OPEN", "FAIL_OPEN_VALIDATION_BEHAVIOR"],
    ["EXECUTION_AUTHORITY", "EXECUTION_AUTHORITY_GRANTED"],
  ] as readonly [NonNullable<FoundationSchemaCertificationInput["scenario"]>, FoundationSchemaCertificationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runFoundationSchemaCertification({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_schemas_or_contracts).toBe(false);
  });

  it("fails closed when the role lacks certification visibility", () => {
    const result = runFoundationSchemaCertification({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects replay tampering", () => {
    const result = runFoundationSchemaCertification();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayFoundationSchemaCertification(tampered)).toBe(false);
  });
});
