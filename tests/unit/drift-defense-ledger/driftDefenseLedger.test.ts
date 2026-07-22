import { describe, expect, it } from "vitest";
import {
  getDriftDefenseLedgerFoundation,
  recordDriftDefenseLedger,
  replayDriftDefenseLedger,
} from "@/services/drift-defense-ledger";
import type { DriftLedgerFailure, DriftLedgerScenario, DriftLedgerStatus } from "@/types/drift-defense-ledger";

describe("Mission Control Phase 10.12.13 Drift Defense Ledger", () => {
  it("publishes the drift defense ledger contract", () => {
    const foundation = getDriftDefenseLedgerFoundation();

    expect(foundation.drift_defense_ledger_version).toBe("drift-defense-ledger/v1");
    expect(foundation.api_surface.record_drift_event).toBe("POST /drift-defense-ledger/record");
    expect(foundation.api_surface.retrieve_schema).toBe("POST /drift-defense-ledger/schema");
    expect(foundation.api_surface.retrieve_validation).toBe("POST /drift-defense-ledger/validation");
    expect(foundation.api_surface.retrieve_evidence_lineage).toBe("POST /drift-defense-ledger/evidence-lineage");
    expect(foundation.api_surface.retrieve_replay_refs).toBe("POST /drift-defense-ledger/replay-refs");
    expect(foundation.api_surface.retrieve_contract).toBe("GET /drift-defense-ledger/contract");
    expect(foundation.api_surface.mutation_supported).toBe(false);
    expect(foundation.api_surface.deletion_supported).toBe(false);
    expect(foundation.api_surface.governance_bypass_supported).toBe(false);
    expect(foundation.api_surface.fail_open_supported).toBe(false);
    expect(foundation.result.ledger_identifier).toBe("DriftDefenseLedger");
    expect(foundation.result.status).toBe("COMMITTED");
  });

  it("records deterministically with stable replay and integrity hashes", () => {
    const first = recordDriftDefenseLedger();
    const second = recordDriftDefenseLedger();

    expect(first.schema.integrity_hash).toBe(second.schema.integrity_hash);
    expect(first.adaptive_drift_record.integrity_hash).toBe(second.adaptive_drift_record.integrity_hash);
    expect(first.validation_report.integrity_hash).toBe(second.validation_report.integrity_hash);
    expect(first.evidence_lineage.integrity_hash).toBe(second.evidence_lineage.integrity_hash);
    expect(first.replay_references.integrity_hash).toBe(second.replay_references.integrity_hash);
    expect(first.governance_history.integrity_hash).toBe(second.governance_history.integrity_hash);
    expect(first.certification_history.integrity_hash).toBe(second.certification_history.integrity_hash);
    expect(first.rollback_history.integrity_hash).toBe(second.rollback_history.integrity_hash);
    expect(first.timeline.integrity_hash).toBe(second.timeline.integrity_hash);
    expect(first.integrity_report.integrity_hash).toBe(second.integrity_report.integrity_hash);
    expect(first.ledger_entry.integrity_hash).toBe(second.ledger_entry.integrity_hash);
    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayDriftDefenseLedger(first)).toBe(true);
  });

  it("maintains the authoritative drift ledger schema", () => {
    const schema = recordDriftDefenseLedger().schema;

    expect(schema.schema_id).toBe("drift_ledger_schema_v1");
    expect(schema.schema_version).toBe("drift-ledger-schema/v1");
    expect(schema.supported_drift_types).toEqual(expect.arrayContaining(["STRATEGIC_DRIFT", "CONFIDENCE_DRIFT", "RISK_DRIFT", "GOVERNANCE_DRIFT", "AUTHORITY_DRIFT", "OPERATOR_FEEDBACK_DRIFT", "EVIDENCE_DRIFT", "TENANT_ISOLATION_DRIFT", "OPTIMIZATION_DRIFT", "REPLAY_DRIFT"]));
    expect(schema.required_fields).toContain("drift_id");
    expect(schema.validation_rules).toContain("append_only_commit");
    expect(schema.governance_requirements).toContain("no_governance_bypass");
    expect(schema.constitutional_requirements).toContain("tenant_isolation_required");
    expect(schema.replay_requirements).toContain("forensic_reconstruction_required");
    expect(schema.certification_requirements).toContain("audit_ready");
    expect(schema.approval_reference).toBe("governance-approval:drift-ledger-schema:v1");
    expect(schema.integrity_hash).toMatch(/[a-f0-9]{64}/);
  });

  it("commits complete adaptive drift records with lineage, replay, timeline, and ledger evidence", () => {
    const result = recordDriftDefenseLedger({ drift_type: "REPLAY_DRIFT" });

    expect(result.adaptive_drift_record.drift_id).toMatch(/^adaptive_drift_/);
    expect(result.adaptive_drift_record.drift_type).toBe("REPLAY_DRIFT");
    expect(result.adaptive_drift_record.replay_refs).toContain("replay:drift-defense-ledger");
    expect(result.validation_report.valid).toBe(true);
    expect(result.evidence_lineage.lineage_complete).toBe(true);
    expect(result.replay_references.deterministic_reconstruction_supported).toBe(true);
    expect(result.governance_history.governance_reviews).toContain("governance:response-policy-review");
    expect(result.certification_history.certification_outcomes).toContain("certification:ready");
    expect(result.rollback_history.restored_baseline).toBe("last_certified_adaptive_state");
    expect(result.timeline.final_disposition).toBe("committed");
    expect(result.integrity_report.ledger_health_assessment).toBe("Ledger health verified.");
    expect(result.ledger_entry.committed).toBe(true);
    expect(result.ledger_entry.previous_entry_hash).toMatch(/^0{64}$/);
  });

  it("enforces immutable append-only ledger invariants", () => {
    const result = recordDriftDefenseLedger();

    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.explainable).toBe(true);
    expect(result.evidence_backed).toBe(true);
    expect(result.governance_preserved).toBe(true);
    expect(result.constitutional_preserved).toBe(true);
    expect(result.operator_authority_preserved).toBe(true);
    expect(result.tenant_isolated).toBe(true);
    expect(result.append_only).toBe(true);
    expect(result.immutable).toBe(true);
    expect(result.mutates_existing_records).toBe(false);
  });

  it.each([
    ["INCOMPLETE_RECORD", "INCOMPLETE_RECORD", "REJECTED"],
    ["INVALID_LINEAGE", "INVALID_EVIDENCE_LINEAGE", "REJECTED"],
    ["MISSING_EVIDENCE", "MISSING_EVIDENCE", "REJECTED"],
    ["INVALID_REPLAY_REFERENCES", "INVALID_REPLAY_REFERENCES", "REJECTED"],
    ["TENANT_VIOLATION", "TENANT_OWNERSHIP_VIOLATION", "FAIL_CLOSED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_FAILURE", "FAIL_CLOSED"],
    ["LEDGER_TAMPERING", "LEDGER_TAMPERING", "FAIL_CLOSED"],
    ["RECORD_CORRUPTION", "RECORD_CORRUPTION", "REJECTED"],
    ["MISSING_LINEAGE", "MISSING_LINEAGE", "REJECTED"],
    ["REPLAY_INCONSISTENCY", "REPLAY_INCONSISTENCY", "REJECTED"],
    ["UNAUTHORIZED_MODIFICATION", "UNAUTHORIZED_MODIFICATION", "REJECTED"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_LEDGER_RECORDING", "REJECTED"],
    ["NONREPLAYABLE_EVIDENCE", "NONREPLAYABLE_LEDGER_EVIDENCE", "REJECTED"],
    ["UNKNOWN_BEHAVIOR", "UNKNOWN_LEDGER_BEHAVIOR", "FAIL_CLOSED"],
  ] as readonly [DriftLedgerScenario, DriftLedgerFailure, DriftLedgerStatus][])(
    "maps %s to %s with %s status",
    (scenario, failure, status) => {
      const result = recordDriftDefenseLedger({ scenario });

      expect(result.failures).toContain(failure);
      expect(result.status).toBe(status);
      expect(result.validation_report.rejection_reasons).toContain(failure);
      expect(result.ledger_entry.committed).toBe(false);
      expect(replayDriftDefenseLedger(result)).toBe(true);
    },
  );

  it("degrades ledger guarantees for matching validation failures", () => {
    expect(recordDriftDefenseLedger({ scenario: "NONDETERMINISTIC" }).deterministic).toBe(false);
    const replay = recordDriftDefenseLedger({ scenario: "NONREPLAYABLE_EVIDENCE" });
    expect(replay.replayable).toBe(false);
    expect(recordDriftDefenseLedger({ scenario: "MISSING_EVIDENCE" }).evidence_backed).toBe(false);
    expect(recordDriftDefenseLedger({ scenario: "TENANT_VIOLATION" }).tenant_isolated).toBe(false);
    expect(recordDriftDefenseLedger({ scenario: "TENANT_VIOLATION" }).constitutional_preserved).toBe(false);
  });

  it("fails replay when ledger evidence is tampered", () => {
    const result = recordDriftDefenseLedger();
    const tampered = {
      ...result,
      ledger_entry: {
        ...result.ledger_entry,
        previous_entry_hash: "tampered",
      },
    };

    expect(replayDriftDefenseLedger(result)).toBe(true);
    expect(replayDriftDefenseLedger(tampered)).toBe(false);
  });
});
