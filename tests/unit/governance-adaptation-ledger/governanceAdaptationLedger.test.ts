import { describe, expect, it } from "vitest";
import {
  appendGovernanceAdaptationLedger,
  getGovernanceAdaptationLedgerFoundation,
  replayGovernanceAdaptationLedger,
} from "@/services/governance-adaptation-ledger";
import type {
  GovernanceAdaptationLedgerEventType,
  GovernanceAdaptationLedgerFailure,
  GovernanceAdaptationLedgerScenario,
} from "@/types/governance-adaptation-ledger";

describe("Mission Control Phase 10.8.6 Governance Adaptation Ledger", () => {
  it("publishes the governance adaptation ledger foundation", () => {
    const foundation = getGovernanceAdaptationLedgerFoundation();

    expect(foundation.governance_adaptation_ledger_version).toBe("governance-adaptation-ledger/v1");
    expect(foundation.api_surface.append_entry).toBe("POST /governance-adaptation-ledger/append");
    expect(foundation.api_surface.update_supported).toBe(false);
    expect(foundation.api_surface.delete_supported).toBe(false);
    expect(foundation.api_surface.fail_open_supported).toBe(false);
    expect(foundation.result.validation_state).toBe("CERTIFIED");
  });

  it("appends deterministic immutable ledger entries", () => {
    const first = appendGovernanceAdaptationLedger({ scenario: "GOVERNANCE_DECISION" });
    const second = appendGovernanceAdaptationLedger({ scenario: "GOVERNANCE_DECISION" });

    expect(first.entries[0].ledger_entry_id).toBe(second.entries[0].ledger_entry_id);
    expect(first.entries[0].entry_hash).toBe(second.entries[0].entry_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.append_only).toBe(true);
    expect(first.immutable).toBe(true);
    expect(first.tamper_evident).toBe(true);
    expect(first.advisory_only).toBe(true);
  });

  it.each([
    ["VALIDATION", "VALIDATION_RECORDED"],
    ["GOVERNANCE_DECISION", "GOVERNANCE_DECISION"],
    ["CONSTITUTIONAL_REVIEW", "CONSTITUTIONAL_REVIEW"],
    ["AUTHORITY_REVIEW", "AUTHORITY_REVIEW"],
    ["POLICY_CONFLICT", "POLICY_CONFLICT"],
    ["APPROVAL_REQUIRED", "APPROVAL_REQUIRED"],
    ["APPROVAL_COMPLETED", "APPROVAL_COMPLETED"],
    ["SIMULATION_AUTHORIZED", "SIMULATION_AUTHORIZED"],
    ["SIMULATION_DENIED", "SIMULATION_DENIED"],
    ["OPERATOR_DECISION", "OPERATOR_DECISION"],
    ["ESCALATION_CREATED", "ESCALATION_CREATED"],
    ["ESCALATION_RESOLVED", "ESCALATION_RESOLVED"],
    ["CERTIFICATION_UPDATED", "CERTIFICATION_UPDATED"],
    ["ROLLBACK_REGISTERED", "ROLLBACK_REGISTERED"],
    ["REPLAY_REGISTERED", "REPLAY_REGISTERED"],
    ["LEDGER_VERIFIED", "LEDGER_VERIFIED"],
  ] as readonly [GovernanceAdaptationLedgerScenario, GovernanceAdaptationLedgerEventType][])("records %s as %s", (scenario, eventType) => {
    const result = appendGovernanceAdaptationLedger({ scenario });

    expect(result.entries[0].event_type).toBe(eventType);
    expect(result.lineage_graph.event_chronology).toEqual([eventType]);
  });

  it("preserves validation, decision, authority, conflict, and lineage evidence", () => {
    const result = appendGovernanceAdaptationLedger({ scenario: "POLICY_CONFLICT" });
    const entry = result.entries[0];

    expect(entry.validation_reference).toContain("governance_validation");
    expect(entry.governance_decision).toBeTruthy();
    expect(entry.constitutional_review).toBeTruthy();
    expect(entry.authority_review).toBeTruthy();
    expect(entry.evidence_references.length).toBeGreaterThan(4);
    expect(entry.replay_lineage.length).toBeGreaterThan(3);
    expect(entry.rollback_lineage).toContain("rollback_lineage_ref_governance_adaptation");
    expect(entry.certification_lineage).toContain("certification_lineage_ref_governance_adaptation");
    expect(result.lineage_graph.complete).toBe(true);
  });

  it("authorizes and denies simulation without performing simulation side effects", () => {
    expect(appendGovernanceAdaptationLedger({ scenario: "SIMULATION_AUTHORIZED" }).entries[0].simulation_authorization).toBe("AUTHORIZED");
    expect(appendGovernanceAdaptationLedger({ scenario: "SIMULATION_DENIED" }).entries[0].simulation_authorization).toBe("DENIED");
    expect(appendGovernanceAdaptationLedger({ scenario: "OPERATOR_DECISION" }).entries[0].operator_decision).toBe("APPROVED");
  });

  it.each([
    ["APPEND_FAILURE", "LEDGER_APPEND_FAILED"],
    ["ENTRY_MODIFIED", "LEDGER_ENTRY_MODIFIED"],
    ["ENTRY_DELETED", "LEDGER_ENTRY_DELETED"],
    ["HASH_MISMATCH", "HASH_VERIFICATION_FAILED"],
    ["BROKEN_PARENT_HASH", "PARENT_HASH_CONTINUITY_BROKEN"],
    ["BAD_TIMESTAMP", "TIMESTAMP_ORDERING_INVALID"],
    ["MISSING_REPLAY_LINEAGE", "REPLAY_LINEAGE_INCOMPLETE"],
    ["MISSING_ROLLBACK_LINEAGE", "ROLLBACK_LINEAGE_INCOMPLETE"],
    ["MISSING_CERTIFICATION_LINEAGE", "CERTIFICATION_LINEAGE_INCOMPLETE"],
    ["MISSING_EVIDENCE_LINK", "SUPPORTING_EVIDENCE_UNLINKED"],
    ["TENANT_UNVERIFIED", "TENANT_OWNERSHIP_UNVERIFIED"],
    ["CROSS_TENANT_REFERENCE", "CROSS_TENANT_LEDGER_REFERENCE"],
    ["BROKEN_CHRONOLOGY", "EVENT_CHRONOLOGY_UNRECONSTRUCTABLE"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE"],
    ["LEDGER_CORRUPTION", "LEDGER_CORRUPTION_DETECTED"],
  ] as readonly [GovernanceAdaptationLedgerScenario, GovernanceAdaptationLedgerFailure][])("fails closed for %s", (scenario, failure) => {
    const result = appendGovernanceAdaptationLedger({ scenario });

    expect(result.integrity_report.failures).toContain(failure);
    expect(result.validation_state).toBe("FAIL_CLOSED");
    expect(result.fail_closed).toBe(true);
    expect(result.audit_ready).toBe(false);
    expect(result.entries[0].append_only).toBe(true);
  });

  it("reports integrity dimensions independently", () => {
    const brokenParent = appendGovernanceAdaptationLedger({ scenario: "BROKEN_PARENT_HASH" });
    const crossTenant = appendGovernanceAdaptationLedger({ scenario: "CROSS_TENANT_REFERENCE" });
    const missingEvidence = appendGovernanceAdaptationLedger({ scenario: "MISSING_EVIDENCE_LINK" });

    expect(brokenParent.integrity_report.parent_hash_continuity).toBe(false);
    expect(crossTenant.integrity_report.tenant_ownership_verified).toBe(false);
    expect(missingEvidence.integrity_report.referential_integrity_verified).toBe(false);
  });

  it("replays ledger output and detects tampering", () => {
    const result = appendGovernanceAdaptationLedger({ scenario: "BASELINE" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayGovernanceAdaptationLedger(result)).toBe(true);
    expect(replayGovernanceAdaptationLedger(tampered)).toBe(false);
  });
});
