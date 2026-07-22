import { describe, expect, it } from "vitest";
import {
  establishMemoryQualificationValidation,
  getMemoryQualificationValidation,
  replayMemoryQualificationValidation,
} from "@/services/memory-qualification-validation";
import type {
  MemoryQualificationFailure,
  MemoryQualificationScenario,
  QualificationStatus,
  ValidationEngine,
} from "@/types/memory-qualification-validation";

describe("Mission Control Phase 10.13F Memory Qualification & Validation", () => {
  const engines: readonly ValidationEngine[] = [
    "EVIDENCE_VALIDATION",
    "REPLAY_VALIDATION",
    "GOVERNANCE_VALIDATION",
    "CONFIDENCE_VALIDATION",
    "CERTIFICATION_VALIDATION",
    "INTEGRITY_VERIFICATION",
  ];

  const statuses: readonly QualificationStatus[] = [
    "QUALIFIED",
    "CONDITIONALLY_QUALIFIED",
    "REJECTED",
    "PENDING_GOVERNANCE",
    "PENDING_CERTIFICATION",
  ];

  it("publishes the authoritative memory qualification contract", () => {
    const framework = getMemoryQualificationValidation();

    expect(framework.memory_qualification_version).toBe("memory-qualification-validation/v1");
    expect(framework.supported_validation_engines).toEqual(engines);
    expect(framework.supported_statuses).toEqual(statuses);
    expect(framework.api_surface.establish_framework).toBe("POST /memory-qualification-validation/establish");
    expect(framework.api_surface.retrieve_contract).toBe("GET /memory-qualification-validation/contract");
    expect(framework.api_surface.replay_framework).toBe("POST /memory-qualification-validation/replay");
    expect(framework.api_surface.unqualified_registration_supported).toBe(false);
    expect(framework.api_surface.execution_authority_supported).toBe(false);
    expect(framework.api_surface.governance_bypass_supported).toBe(false);
    expect(framework.result.framework_identifier).toBe("MemoryQualificationValidation");
    expect(framework.result.status).toBe("AUTHORITATIVE");
  });

  it("establishes deterministic qualification decisions, replay, and integrity", () => {
    const first = establishMemoryQualificationValidation();
    const second = establishMemoryQualificationValidation();

    expect(first.qualification_records.map((record) => record.integrity_hash)).toEqual(second.qualification_records.map((record) => record.integrity_hash));
    expect(first.qualification_ledger.map((entry) => entry.integrity_hash)).toEqual(second.qualification_ledger.map((entry) => entry.integrity_hash));
    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayMemoryQualificationValidation(first)).toBe(true);
  });

  it("qualifies valid historical intelligence through all validators", () => {
    const result = establishMemoryQualificationValidation();

    expect(result.qualification_records).toHaveLength(10);
    expect(result.qualification_records.every((record) => record.qualification_status === "QUALIFIED")).toBe(true);
    expect(result.qualification_records.every((record) => record.workflow_state === "REGISTERED")).toBe(true);
    expect(result.qualification_records.every((record) => record.qualification_score === 1)).toBe(true);
    expect(result.qualification_records.every((record) => record.evidence_validation.complete)).toBe(true);
    expect(result.qualification_records.every((record) => record.replay_validation.complete)).toBe(true);
    expect(result.qualification_records.every((record) => record.governance_validation.complete)).toBe(true);
    expect(result.qualification_records.every((record) => record.confidence_validation.complete)).toBe(true);
    expect(result.qualification_records.every((record) => record.certification_validation.complete)).toBe(true);
  });

  it("records append-only immutable qualification ledger events", () => {
    const result = establishMemoryQualificationValidation();

    expect(result.qualification_ledger).toHaveLength(90);
    expect(result.qualification_ledger.every((entry) => entry.append_only)).toBe(true);
    expect(result.qualification_ledger.every((entry) => entry.immutable)).toBe(true);
    expect(result.qualification_ledger.every((entry) => entry.deterministic)).toBe(true);
    expect(result.qualification_ledger.every((entry) => entry.replayable)).toBe(true);
    expect(result.qualification_ledger.every((entry) => entry.tenant_isolated)).toBe(true);
    expect(result.qualification_ledger.every((entry) => entry.cryptographically_verified)).toBe(true);
  });

  it("enforces quality-gate and advisory-only boundaries", () => {
    const result = establishMemoryQualificationValidation();

    expect(result.contract.quality_gate).toBe(true);
    expect(result.contract.qualification_before_memory).toBe(true);
    expect(result.contract.advisory_only).toBe(true);
    expect(result.contract.execution_authority_supported).toBe(false);
    expect(result.contract.unqualified_registration_supported).toBe(false);
    expect(result.qualified_memory_approved).toBe(true);
    expect(result.invalid_memory_rejected).toBe(false);
    expect(result.advisory_only).toBe(true);
  });

  it("publishes observability metrics", () => {
    const metrics = establishMemoryQualificationValidation().metrics;

    expect(metrics.qualification_requests).toBe(10);
    expect(metrics.qualification_success_rate).toBe(1);
    expect(metrics.qualification_failures).toBe(0);
    expect(metrics.evidence_validation_failures).toBe(0);
    expect(metrics.replay_failures).toBe(0);
    expect(metrics.governance_rejections).toBe(0);
    expect(metrics.confidence_validation_failures).toBe(0);
    expect(metrics.certification_failures).toBe(0);
    expect(metrics.qualification_latency_ms).toBe(11);
    expect(metrics.replay_success_rate).toBe(1);
  });

  it.each([
    ["SIMILARITY_ENGINE_UNAVAILABLE", "SIMILARITY_ENGINE_UNAVAILABLE"],
    ["UNQUALIFIED_APPROVED", "UNQUALIFIED_MEMORY_APPROVED"],
    ["MISSING_EVIDENCE", "QUALIFIED_MEMORY_LACKS_EVIDENCE"],
    ["REPLAY_UNAVAILABLE", "REPLAY_UNAVAILABLE"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASSED"],
    ["CERTIFICATION_IGNORED", "CERTIFICATION_IGNORED"],
    ["CONFIDENCE_OMITTED", "CONFIDENCE_VALIDATION_OMITTED"],
    ["INCOMPLETE_EVIDENCE_LINEAGE", "EVIDENCE_LINEAGE_INCOMPLETE"],
    ["TENANT_BREACH", "TENANT_ISOLATION_VIOLATED"],
    ["NONDETERMINISTIC_QUALIFICATION", "DETERMINISTIC_QUALIFICATION_FAILED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION"],
    ["UNAUTHORIZED_SOURCE", "UNAUTHORIZED_SOURCE"],
    ["DUPLICATE_MEMORY", "DUPLICATE_MEMORY_DETECTED"],
  ] as const)("rejects or holds qualification for %s", (scenario: MemoryQualificationScenario, failure: MemoryQualificationFailure) => {
    const result = establishMemoryQualificationValidation({ scenario });

    expect(result.status).toBe("REJECTED");
    expect(result.failures).toContain(failure);
    expect(result.metrics.qualification_success_rate).toBe(0);
    expect(result.invalid_memory_rejected).toBe(true);
    expect(replayMemoryQualificationValidation(result)).toBe(true);
  });

  it("routes missing evidence to conditional qualification", () => {
    const result = establishMemoryQualificationValidation({ scenario: "MISSING_EVIDENCE" });

    expect(result.qualification_records.every((record) => record.qualification_status === "CONDITIONALLY_QUALIFIED")).toBe(true);
    expect(result.qualification_records.every((record) => record.workflow_state === "PENDING_ADDITIONAL_EVIDENCE")).toBe(true);
    expect(result.evidence_lineage_preserved).toBe(false);
  });

  it("routes governance and certification failures to pending states", () => {
    const governance = establishMemoryQualificationValidation({ scenario: "GOVERNANCE_BYPASS" });
    const certification = establishMemoryQualificationValidation({ scenario: "CERTIFICATION_IGNORED" });

    expect(governance.qualification_records.every((record) => record.qualification_status === "PENDING_GOVERNANCE")).toBe(true);
    expect(certification.qualification_records.every((record) => record.qualification_status === "PENDING_CERTIFICATION")).toBe(true);
  });

  it("detects nested qualification tampering", () => {
    const result = establishMemoryQualificationValidation();
    const tampered = {
      ...result,
      qualification_records: [
        {
          ...result.qualification_records[0],
          tenant_id: "tenant-other",
        },
        ...result.qualification_records.slice(1),
      ],
    };

    expect(replayMemoryQualificationValidation(tampered)).toBe(false);
  });
});
