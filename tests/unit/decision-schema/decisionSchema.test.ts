import { describe, expect, it } from "vitest";
import {
  DECISION_JSON_SCHEMA_REGISTRY,
  assertDecisionInputType,
  assertDecisionMetadataType,
  assertDecisionOutputType,
  assertDecisionReferenceType,
  buildDecisionSchemaObservabilityMetrics,
  createDecisionInput,
  createDecisionMetadata,
  createDecisionOrchestrationRecord,
  createDecisionOutput,
  hashDecisionSchemaPayload,
  serializeDecisionSchemaDeterministically,
  validateDecisionInputSchema,
  validateDecisionMetadataSchema,
  validateDecisionOrchestrationRecordSchema,
  validateDecisionOutputSchema,
  validateDecisionReferenceSchema,
} from "@/services/decision-schema";

describe("Mission Control Phase 9.1.2 Decision Schema Definitions", () => {
  it("publishes JSON schema bindings for all Phase 9.1.2 deliverables", () => {
    expect(Object.keys(DECISION_JSON_SCHEMA_REGISTRY)).toEqual([
      "decision.input.schema.json",
      "decision.output.schema.json",
      "decision.metadata.schema.json",
      "decision.reference.schema.json",
      "decision.enums.schema.json",
      "decision.orchestration.record.schema.json",
    ]);
    expect(DECISION_JSON_SCHEMA_REGISTRY["decision.input.schema.json"].required).toContain("governance_refs");
    expect(DECISION_JSON_SCHEMA_REGISTRY["decision.reference.schema.json"].enum_fields.ref_type).toContain("CONSTITUTIONAL");
  });

  it("builds and validates canonical input, metadata, reference, output, and record schemas", () => {
    const input = createDecisionInput();
    const output = createDecisionOutput();
    const record = createDecisionOrchestrationRecord({ input, output });

    expect(validateDecisionInputSchema(input).validation_status).toBe("VALID");
    expect(validateDecisionMetadataSchema(input.metadata).validation_status).toBe("VALID");
    expect(validateDecisionReferenceSchema(input.governance_refs[0]).validation_status).toBe("VALID");
    expect(validateDecisionOutputSchema(output).validation_status).toBe("VALID");
    expect(validateDecisionOrchestrationRecordSchema(record).validation_status).toBe("VALID");
  });

  it("serializes and hashes deterministically for identical schema payloads", () => {
    const first = createDecisionInput();
    const second = createDecisionInput();

    expect(serializeDecisionSchemaDeterministically(first)).toBe(serializeDecisionSchemaDeterministically(second));
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(hashDecisionSchemaPayload(first)).toBe(first.integrity_hash);
  });

  it("fails closed on missing required fields and unsupported enums", () => {
    expect(validateDecisionInputSchema({ ...createDecisionInput(), orchestration_id: "" }).errors.some((error) => error.reason === "REQUIRED_FIELD_MISSING")).toBe(true);
    expect(validateDecisionInputSchema(createDecisionInput({ decision_type: "BAD_TYPE" as never })).errors.some((error) => error.reason === "UNSUPPORTED_ENUM")).toBe(true);
    expect(validateDecisionOutputSchema(createDecisionOutput({ decision_state: "BAD_STATE" as never })).errors.some((error) => error.reason === "UNSUPPORTED_ENUM")).toBe(true);
  });

  it("requires governance, constitutional, replay, and lineage references on input payloads", () => {
    expect(validateDecisionInputSchema(createDecisionInput({ governance_refs: [] })).checks.governance_present).toBe(false);
    expect(validateDecisionInputSchema(createDecisionInput({ constitutional_refs: [] })).checks.constitutional_present).toBe(false);
    expect(validateDecisionInputSchema(createDecisionInput({ replay_refs: [] })).checks.replay_present).toBe(false);
    expect(validateDecisionInputSchema(createDecisionInput({ lineage_refs: [] })).checks.lineage_present).toBe(false);
  });

  it("rejects malformed metadata and non-normalized timestamps", () => {
    expect(validateDecisionMetadataSchema(createDecisionMetadata({ schema_version: "2.0.0" as never })).errors.some((error) => error.reason === "METADATA_MALFORMED")).toBe(true);
    expect(validateDecisionMetadataSchema(createDecisionMetadata({ created_at: "2026-07-02" })).errors.some((error) => error.reason === "TIMESTAMP_NOT_NORMALIZED")).toBe(true);
    expect(validateDecisionReferenceSchema({ ...createDecisionInput().input_refs[0], created_at: "2026-07-02" }).errors.some((error) => error.reason === "TIMESTAMP_NOT_NORMALIZED")).toBe(true);
  });

  it("enforces tenant and mission isolation across references", () => {
    const input = createDecisionInput();
    const crossTenantRef = { ...input.governance_refs[0], tenant_id: "tenant_beta" };
    const crossMissionRef = { ...input.replay_refs[0], mission_id: "mission_other" };

    expect(validateDecisionInputSchema(createDecisionInput({ governance_refs: [crossTenantRef] })).errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION")).toBe(true);
    expect(validateDecisionInputSchema(createDecisionInput({ replay_refs: [crossMissionRef] })).errors.some((error) => error.reason === "MISSION_SCOPE_VIOLATION")).toBe(true);
  });

  it("enforces deterministic reference ordering", () => {
    const input = createDecisionInput();
    const later = { ...input.input_refs[0], ref_id: "input_tenant_alpha_z" };
    const earlier = { ...input.input_refs[0], ref_id: "input_tenant_alpha_a" };
    const unordered = createDecisionInput({ input_refs: [later, earlier] });

    expect(validateDecisionInputSchema(unordered).errors.some((error) => error.reason === "REFERENCE_ORDER_NONDETERMINISTIC")).toBe(true);
  });

  it("requires output option references, governance and constitutional results, replay, lineage, advisory-only state, and valid hash", () => {
    const output = createDecisionOutput();
    const noOptions = { ...output, selected_option_ref: undefined, rejected_option_refs: [], deferred_option_refs: [] };

    expect(validateDecisionOutputSchema(noOptions).errors.some((error) => error.reason === "OUTPUT_OPTION_REFERENCE_MISSING")).toBe(true);
    expect(validateDecisionOutputSchema(createDecisionOutput({ advisory_only: false as true })).errors.some((error) => error.reason === "ADVISORY_ONLY_VIOLATION")).toBe(true);
    expect(validateDecisionOutputSchema(createDecisionOutput({ governance_result_ref: { ...output.governance_result_ref, ref_type: "EVIDENCE" as never } })).errors.some((error) => error.reason === "REFERENCE_TYPE_MISMATCH")).toBe(true);
    expect(validateDecisionOutputSchema(createDecisionOutput({ replay_refs: [] })).checks.replay_present).toBe(false);
    expect(validateDecisionOutputSchema(createDecisionOutput({ integrity_hash: "tampered" })).errors.some((error) => error.reason === "INTEGRITY_HASH_MISMATCH")).toBe(true);
  });

  it("verifies type assertion APIs and reports observability metrics", () => {
    const input = createDecisionInput();
    const output = createDecisionOutput();

    expect(() => assertDecisionInputType(input)).not.toThrow();
    expect(() => assertDecisionOutputType(output)).not.toThrow();
    expect(() => assertDecisionReferenceType(input.input_refs[0])).not.toThrow();
    expect(() => assertDecisionMetadataType(input.metadata)).not.toThrow();
    expect(() => assertDecisionInputType(createDecisionInput({ governance_refs: [] }))).toThrow(/REFERENCE_MISSING/);

    const metrics = buildDecisionSchemaObservabilityMetrics([
      validateDecisionInputSchema(input),
      validateDecisionInputSchema(createDecisionInput({ decision_type: "BAD_TYPE" as never })),
      validateDecisionInputSchema(createDecisionInput({ governance_refs: [{ ...input.governance_refs[0], tenant_id: "tenant_beta" }] })),
    ]);
    expect(metrics.schema_validation_count).toBe(3);
    expect(metrics.schema_validation_failures).toBe(2);
    expect(metrics.unsupported_enum_count).toBe(1);
    expect(metrics.cross_tenant_reference_rejection_count).toBe(1);
  });
});
