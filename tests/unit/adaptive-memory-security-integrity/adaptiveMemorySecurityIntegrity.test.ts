import { describe, expect, it } from "vitest";
import {
  establishAdaptiveMemorySecurityIntegrity,
  getAdaptiveMemorySecurityIntegrity,
  replayAdaptiveMemorySecurityIntegrity,
} from "@/services/adaptive-memory-security-integrity";
import type {
  SecurityDecision,
  SecurityFailure,
  SecurityScenario,
  SecurityValidator,
} from "@/types/adaptive-memory-security-integrity";

describe("Mission Control Phase 10.13L Adaptive Memory Security & Integrity", () => {
  const validators: readonly SecurityValidator[] = [
    "IDENTITY_AUTHENTICATION",
    "ACCESS_VERIFICATION",
    "GOVERNANCE_VALIDATION",
    "INTEGRITY_VALIDATION",
    "TAMPER_DETECTION",
    "REPLAY_VALIDATION",
    "ENCRYPTION_VALIDATION",
    "POISONING_PROTECTION",
    "TENANT_ISOLATION_VALIDATION",
    "CRYPTOGRAPHIC_VERIFICATION",
  ];

  const decisions: readonly SecurityDecision[] = ["ALLOWED", "BLOCKED"];

  it("publishes the authoritative adaptive memory security contract", () => {
    const framework = getAdaptiveMemorySecurityIntegrity();

    expect(framework.adaptive_memory_security_version).toBe("adaptive-memory-security-integrity/v1");
    expect(framework.supported_validators).toEqual(validators);
    expect(framework.supported_decisions).toEqual(decisions);
    expect(framework.api_surface.establish_security).toBe("POST /adaptive-memory-security-integrity/establish");
    expect(framework.api_surface.retrieve_contract).toBe("GET /adaptive-memory-security-integrity/contract");
    expect(framework.api_surface.direct_memory_modification_supported).toBe(false);
    expect(framework.api_surface.governance_bypass_supported).toBe(false);
    expect(framework.api_surface.privilege_escalation_supported).toBe(false);
    expect(framework.result.framework_identifier).toBe("AdaptiveMemorySecurityIntegrity");
    expect(framework.result.status).toBe("AUTHORITATIVE");
  });

  it("establishes deterministic security records, ledger, metrics, and integrity", () => {
    const first = establishAdaptiveMemorySecurityIntegrity();
    const second = establishAdaptiveMemorySecurityIntegrity();

    expect(first.security_records.map((record) => record.integrity_hash)).toEqual(second.security_records.map((record) => record.integrity_hash));
    expect(first.security_ledger.map((entry) => entry.integrity_hash)).toEqual(second.security_ledger.map((entry) => entry.integrity_hash));
    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayAdaptiveMemorySecurityIntegrity(first)).toBe(true);
  });

  it("allows memory operations only after every security validator verifies", () => {
    const result = establishAdaptiveMemorySecurityIntegrity();

    expect(result.security_records).toHaveLength(10);
    expect(result.security_records.every((record) => record.security_decision === "ALLOWED")).toBe(true);
    expect(result.security_records.every((record) => record.authentication_status.status === "VERIFIED")).toBe(true);
    expect(result.security_records.every((record) => record.authorization_status.status === "VERIFIED")).toBe(true);
    expect(result.security_records.every((record) => record.integrity_validation.status === "VERIFIED")).toBe(true);
    expect(result.security_records.every((record) => record.tamper_detection.status === "VERIFIED")).toBe(true);
    expect(result.security_records.every((record) => record.replay_validation.status === "VERIFIED")).toBe(true);
    expect(result.security_records.every((record) => record.encryption_status.status === "VERIFIED")).toBe(true);
  });

  it("enforces integrity-before-intelligence security policy", () => {
    const result = establishAdaptiveMemorySecurityIntegrity();

    expect(result.contract.integrity_before_intelligence).toBe(true);
    expect(result.contract.zero_trust_validation).toBe(true);
    expect(result.contract.immutable_institutional_knowledge).toBe(true);
    expect(result.contract.security_without_hidden_behavior).toBe(true);
    expect(result.contract.constitutional_security).toBe(true);
    expect(result.contract.deterministic_protection).toBe(true);
    expect(result.contract.direct_memory_modification_supported).toBe(false);
    expect(result.contract.hidden_security_exceptions_supported).toBe(false);
  });

  it("publishes security metrics", () => {
    const metrics = establishAdaptiveMemorySecurityIntegrity().metrics;

    expect(metrics.security_events).toBe(10);
    expect(metrics.integrity_verification_rate).toBe(1);
    expect(metrics.tamper_detections).toBe(0);
    expect(metrics.replay_manipulation_attempts).toBe(0);
    expect(metrics.unauthorized_access_attempts).toBe(0);
    expect(metrics.encryption_health).toBe(1);
    expect(metrics.poisoning_attempts).toBe(0);
    expect(metrics.privilege_escalation_attempts).toBe(0);
    expect(metrics.governance_bypass_attempts).toBe(0);
    expect(metrics.authentication_failures).toBe(0);
    expect(metrics.security_response_latency_ms).toBe(5);
    expect(metrics.blocked_operations).toBe(0);
  });

  it("records append-only immutable security ledger events", () => {
    const result = establishAdaptiveMemorySecurityIntegrity();

    expect(result.security_ledger).toHaveLength(100);
    expect(result.security_ledger.every((entry) => entry.append_only)).toBe(true);
    expect(result.security_ledger.every((entry) => entry.immutable)).toBe(true);
    expect(result.security_ledger.every((entry) => entry.deterministic)).toBe(true);
    expect(result.security_ledger.every((entry) => entry.replayable)).toBe(true);
    expect(result.security_ledger.every((entry) => entry.tenant_isolated)).toBe(true);
    expect(result.security_ledger.every((entry) => entry.cryptographically_verified)).toBe(true);
  });

  it.each([
    ["OBSERVABILITY_UNAVAILABLE", "OBSERVABILITY_UNAVAILABLE"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["UNAUTHORIZED_WRITE", "UNAUTHORIZED_WRITE_SUCCEEDED"],
    ["REPLAY_MANIPULATION", "REPLAY_MANIPULATED"],
    ["MEMORY_POISONING", "MEMORY_POISONING_SUCCEEDED"],
    ["EVIDENCE_ALTERATION", "EVIDENCE_ALTERED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASSED"],
    ["CRYPTOGRAPHIC_FAILURE", "CRYPTOGRAPHIC_VALIDATION_FAILED"],
    ["TENANT_ISOLATION_BREACH", "TENANT_ISOLATION_VIOLATED"],
    ["UNDETECTED_TAMPERING", "TAMPERING_UNDETECTED"],
    ["NONDETERMINISTIC_SECURITY", "SECURITY_DECISION_NONDETERMINISTIC"],
    ["PRIVILEGE_ESCALATION", "PRIVILEGE_ESCALATION_SUCCEEDED"],
    ["UNAUTHORIZED_RETRIEVAL", "UNAUTHORIZED_RETRIEVAL_SUCCEEDED"],
    ["UNAUTHORIZED_INDEXING", "UNAUTHORIZED_INDEXING_SUCCEEDED"],
    ["LINEAGE_CORRUPTION", "LINEAGE_CORRUPTED"],
  ] as const)("blocks unsafe security condition %s", (scenario: SecurityScenario, failure: SecurityFailure) => {
    const result = establishAdaptiveMemorySecurityIntegrity({ scenario });

    expect(result.status).toBe("REJECTED");
    expect(result.failures).toContain(failure);
    expect(result.security_records.every((record) => record.security_decision === "BLOCKED")).toBe(true);
    expect(result.metrics.blocked_operations).toBe(10);
    expect(replayAdaptiveMemorySecurityIntegrity(result)).toBe(true);
  });

  it("generates deterministic alerts for security threats", () => {
    const replay = establishAdaptiveMemorySecurityIntegrity({ scenario: "REPLAY_MANIPULATION" });
    const poisoning = establishAdaptiveMemorySecurityIntegrity({ scenario: "MEMORY_POISONING" });
    const crypto = establishAdaptiveMemorySecurityIntegrity({ scenario: "CRYPTOGRAPHIC_FAILURE" });
    const tenant = establishAdaptiveMemorySecurityIntegrity({ scenario: "TENANT_ISOLATION_BREACH" });

    expect(replay.alerts.some((alert) => alert.alert_type === "REPLAY_MANIPULATION")).toBe(true);
    expect(poisoning.alerts.some((alert) => alert.alert_type === "MEMORY_POISONING_ATTEMPT")).toBe(true);
    expect(crypto.alerts.some((alert) => alert.alert_type === "CRYPTOGRAPHIC_FAILURE")).toBe(true);
    expect(tenant.alerts.some((alert) => alert.alert_type === "TENANT_ISOLATION_VIOLATION")).toBe(true);
  });

  it("blocks access, governance bypass, and poisoning explicitly", () => {
    const access = establishAdaptiveMemorySecurityIntegrity({ scenario: "UNAUTHORIZED_WRITE" });
    const governance = establishAdaptiveMemorySecurityIntegrity({ scenario: "GOVERNANCE_BYPASS" });
    const poisoning = establishAdaptiveMemorySecurityIntegrity({ scenario: "MEMORY_POISONING" });

    expect(access.access_verified).toBe(false);
    expect(access.security_records.every((record) => record.authorization_status.status === "FAILED")).toBe(true);
    expect(governance.governance_enforced).toBe(false);
    expect(governance.security_records.every((record) => record.governance_validation.status === "FAILED")).toBe(true);
    expect(poisoning.poisoning_prevented).toBe(false);
    expect(poisoning.security_records.every((record) => record.poisoning_protection.status === "FAILED")).toBe(true);
  });

  it("detects evidence alteration and replay manipulation", () => {
    const evidence = establishAdaptiveMemorySecurityIntegrity({ scenario: "EVIDENCE_ALTERATION" });
    const replay = establishAdaptiveMemorySecurityIntegrity({ scenario: "REPLAY_MANIPULATION" });

    expect(evidence.security_records.every((record) => record.evidence_refs.length === 0)).toBe(true);
    expect(evidence.security_records.every((record) => record.integrity_validation.status === "FAILED")).toBe(true);
    expect(replay.replayable).toBe(false);
    expect(replay.security_records.every((record) => record.replay_refs.length === 0)).toBe(true);
    expect(replay.security_records.every((record) => record.replay_validation.status === "FAILED")).toBe(true);
  });

  it("preserves tenant isolation and cryptographic verification in baseline", () => {
    const result = establishAdaptiveMemorySecurityIntegrity();

    expect(result.tenant_isolation_preserved).toBe(true);
    expect(result.integrity_verified).toBe(true);
    expect(result.tamper_evident).toBe(true);
    expect(result.encryption_enforced).toBe(true);
    expect(result.security_records.every((record) => record.tenant_id === result.observability_result.lifecycle_result.lifecycle_records.find((lifecycle) => lifecycle.memory_id === record.memory_id)?.tenant_id)).toBe(true);
  });

  it("detects nested security record tampering", () => {
    const result = establishAdaptiveMemorySecurityIntegrity();
    const tampered = {
      ...result,
      security_records: [
        {
          ...result.security_records[0],
          security_decision: "BLOCKED" as const,
        },
        ...result.security_records.slice(1),
      ],
    };

    expect(replayAdaptiveMemorySecurityIntegrity(tampered)).toBe(false);
  });
});
