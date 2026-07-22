import { describe, expect, it } from "vitest";
import {
  appendSimulationValidationLedgerRecord,
  getSimulationValidationLedgerFoundation,
  replaySimulationValidationLedger,
} from "@/services/simulation-validation-ledger";
import type {
  SimulationValidationLedgerFailure,
  SimulationValidationLedgerOperation,
  SimulationValidationLedgerScenario,
} from "@/types/simulation-validation-ledger";

describe("Mission Control Phase 10.11.6 Simulation Validation Ledger", () => {
  const expectedOperations: readonly SimulationValidationLedgerOperation[] = [
    "APPEND_RECORD",
    "VERIFY_INTEGRITY",
    "REPLAY_LOOKUP",
    "PROPOSAL_LOOKUP",
    "SIMULATION_LOOKUP",
    "DIVERGENCE_LOOKUP",
    "CERTIFICATION_LOOKUP",
    "AUDIT_RETRIEVAL",
    "LINEAGE_TRAVERSAL",
  ];

  it("publishes the simulation validation ledger contract", () => {
    const foundation = getSimulationValidationLedgerFoundation();

    expect(foundation.simulation_validation_ledger_version).toBe("simulation-validation-ledger/v1");
    expect(foundation.supported_operations).toEqual(expectedOperations);
    expect(foundation.api_surface.append_record).toBe("POST /simulation-validation-ledger/append");
    expect(foundation.api_surface.retrieve_contract).toBe("GET /simulation-validation-ledger/contract");
    expect(foundation.api_surface.update_supported).toBe(false);
    expect(foundation.api_surface.delete_supported).toBe(false);
    expect(foundation.api_surface.cross_tenant_access_supported).toBe(false);
    expect(foundation.api_surface.fail_open_supported).toBe(false);
    expect(foundation.result.ledger_identifier).toBe("SimulationValidationLedger");
    expect(foundation.result.ledger_status).toBe("COMMITTED");
  });

  it("commits deterministic ledger records with stable replay and integrity hashes", () => {
    const first = appendSimulationValidationLedgerRecord();
    const second = appendSimulationValidationLedgerRecord();

    expect(first.record.integrity_hash).toBe(second.record.integrity_hash);
    expect(first.evidence_package.integrity_hash).toBe(second.evidence_package.integrity_hash);
    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replaySimulationValidationLedger(first)).toBe(true);
  });

  it("generates the canonical SimulationValidationLedgerRecord", () => {
    const record = appendSimulationValidationLedgerRecord().record;

    expect(record.ledger_record_id).toMatch(/^simulation_ledger_/);
    expect(record.proposal_id).toBeTruthy();
    expect(record.simulation_id).toMatch(/^counterfactual_simulation_/);
    expect(record.tenant_id).toBeTruthy();
    expect(record.simulation_configuration).toMatch(/[a-f0-9]{64}/);
    expect(record.replay_inputs).toMatch(/[a-f0-9]{64}/);
    expect(record.replay_outputs).toMatch(/[a-f0-9]{64}/);
    expect(record.divergence_analysis).toMatch(/[a-f0-9]{64}/);
    expect(record.improvement_metrics).toMatch(/[a-f0-9]{64}/);
    expect(record.governance_analysis).toMatch(/[a-f0-9]{64}/);
    expect(record.operator_analysis).toMatch(/[a-f0-9]{64}/);
    expect(record.certification_recommendation).toMatch(/[a-f0-9]{64}/);
    expect(record.replay_hash).toMatch(/[a-f0-9]{64}/);
    expect(record.previous_record_hash).toBe("0".repeat(64));
    expect(record.ledger_sequence).toBe(1);
    expect(record.recorded_timestamp).toBe("2026-07-11T00:00:00.000Z");
  });

  it("enforces append-only immutable ledger properties", () => {
    const result = appendSimulationValidationLedgerRecord();

    expect(result.append_only).toBe(true);
    expect(result.immutable).toBe(true);
    expect(result.single_source_of_truth).toBe(true);
    expect(result.update_supported).toBe(false);
    expect(result.delete_supported).toBe(false);
    expect(result.cross_tenant_access_supported).toBe(false);
    expect(result.metrics.records_committed).toBe(1);
    expect(result.metrics.append_only_enforced).toBe(true);
    expect(result.metrics.immutable_storage_enforced).toBe(true);
  });

  it("preserves replay, proposal, evidence, governance, certification, and operator lineage", () => {
    const metrics = appendSimulationValidationLedgerRecord().metrics;

    expect(metrics.replay_reconstruction_supported).toBe(true);
    expect(metrics.proposal_lineage_complete).toBe(true);
    expect(metrics.evidence_lineage_complete).toBe(true);
    expect(metrics.governance_lineage_complete).toBe(true);
    expect(metrics.certification_lineage_complete).toBe(true);
    expect(metrics.operator_lineage_complete).toBe(true);
    expect(metrics.tenant_isolation_enforced).toBe(true);
    expect(metrics.cryptographic_verification_passed).toBe(true);
    expect(metrics.audit_trail_complete).toBe(true);
  });

  it("produces every required immutable evidence package", () => {
    const pkg = appendSimulationValidationLedgerRecord().evidence_package;

    expect(pkg.simulation_audit_package_hash).toMatch(/[a-f0-9]{64}/);
    expect(pkg.replay_reconstruction_package_hash).toMatch(/[a-f0-9]{64}/);
    expect(pkg.governance_evidence_package_hash).toMatch(/[a-f0-9]{64}/);
    expect(pkg.operator_evidence_package_hash).toMatch(/[a-f0-9]{64}/);
    expect(pkg.certification_evidence_package_hash).toMatch(/[a-f0-9]{64}/);
    expect(pkg.ledger_integrity_report_hash).toMatch(/[a-f0-9]{64}/);
    expect(pkg.lineage_verification_report_hash).toMatch(/[a-f0-9]{64}/);
  });

  it.each([
    ["DIVERGENCE_UNAVAILABLE", "DIVERGENCE_ANALYSIS_UNAVAILABLE"],
    ["RECORD_MODIFICATION", "RECORD_MODIFICATION_ATTEMPT"],
    ["RECORD_DELETION", "RECORD_DELETION_ATTEMPT"],
    ["APPEND_SEQUENCE_CORRUPTION", "APPEND_SEQUENCE_CORRUPTION"],
    ["REPLAY_ARTIFACT_LOSS", "REPLAY_ARTIFACT_LOSS"],
    ["MISSING_PROPOSAL_LINEAGE", "MISSING_PROPOSAL_LINEAGE"],
    ["MISSING_GOVERNANCE_ANALYSIS", "MISSING_GOVERNANCE_ANALYSIS"],
    ["MISSING_OPERATOR_ANALYSIS", "MISSING_OPERATOR_ANALYSIS"],
    ["MISSING_CERTIFICATION_RECOMMENDATION", "MISSING_CERTIFICATION_RECOMMENDATION"],
    ["INTEGRITY_HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["REPLAY_HASH_MISMATCH", "REPLAY_HASH_MISMATCH"],
    ["CRYPTOGRAPHIC_FAILURE", "CRYPTOGRAPHIC_VERIFICATION_FAILURE"],
    ["TENANT_ISOLATION_BREACH", "TENANT_ISOLATION_BREACH"],
    ["INCOMPLETE_AUDIT_TRAIL", "INCOMPLETE_AUDIT_TRAIL"],
    ["UNAUTHORIZED_ACCESS", "UNAUTHORIZED_LEDGER_ACCESS"],
  ] as const)("fails closed for %s", (scenario: SimulationValidationLedgerScenario, failure: SimulationValidationLedgerFailure) => {
    const result = appendSimulationValidationLedgerRecord({ scenario });

    expect(result.ledger_status).toBe("FAIL_CLOSED");
    expect(result.failures).toContain(failure);
    expect(result.metrics.records_committed).toBe(0);
    expect(replaySimulationValidationLedger(result)).toBe(failure === "INTEGRITY_HASH_MISMATCH" ? false : true);
  });

  it("detects nested ledger tampering", () => {
    const result = appendSimulationValidationLedgerRecord();
    const tampered = {
      ...result,
      record: {
        ...result.record,
        ledger_sequence: 2,
      },
    };

    expect(replaySimulationValidationLedger(tampered)).toBe(false);
  });
});
