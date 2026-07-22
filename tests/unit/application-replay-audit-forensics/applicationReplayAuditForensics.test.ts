import { describe, expect, it } from "vitest";
import {
  getApplicationReplayAuditForensicsBundle,
  replayApplicationReplayAuditForensics,
  runApplicationReplayAuditForensics,
  validateApplicationReplayAuditForensics,
} from "@/services/application-replay-audit-forensics";
import type { ApplicationReplayForensicsScenario } from "@/types/application-replay-audit-forensics";

describe("Program 4 P4.9 Replay, Audit, and Forensics", () => {
  it("publishes replay audit forensics doctrine without owning replay execution or evidence mutation", () => {
    const bundle = getApplicationReplayAuditForensicsBundle();

    expect(bundle.doctrine.version).toBe("application-replay-audit-forensics/v4.9");
    expect(bundle.doctrine.owns_replay_requests).toBe(true);
    expect(bundle.doctrine.owns_application_replay_analysis).toBe(true);
    expect(bundle.doctrine.owns_audit_interpretation).toBe(true);
    expect(bundle.doctrine.owns_forensic_interpretation).toBe(true);
    expect(bundle.doctrine.executes_replay_engines).toBe(false);
    expect(bundle.doctrine.replaces_cci_replay_services).toBe(false);
    expect(bundle.doctrine.replaces_caf_behavioral_replay).toBe(false);
    expect(bundle.doctrine.mutates_replay_evidence).toBe(false);
    expect(bundle.doctrine.alters_forensic_evidence).toBe(false);
    expect(bundle.doctrine.modifies_audit_history).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("generates deterministic replay, audit, forensic, correlation, timeline, and lineage outputs", () => {
    const first = runApplicationReplayAuditForensics();
    const second = runApplicationReplayAuditForensics();

    expect(first.governance_binding_ref).toBe("application-governance-binding/v4.8");
    expect(first.cci_replay_infrastructure_ref).toBe("Program 2 - CCI Replay Infrastructure");
    expect(first.caf_behavioral_replay_ref).toBe("Program 3 - CAF Behavioral Replay Evidence");
    expect(first.replay_request.status).toBe("ARCHIVED");
    expect(first.replay_analysis_report.uses_only_cci_replay_evidence).toBe(true);
    expect(first.audit_report.immutable_history_preserved).toBe(true);
    expect(first.forensic_finding.confidence_level).toBe("HIGH");
    expect(first.correlation_map.cross_application_links.length).toBeGreaterThan(0);
    expect(first.investigation_timeline.ordered_events).toEqual([
      "incident-declared",
      "replay-requested",
      "authorization-verified",
      "cci-evidence-retrieved",
      "caf-evidence-linked",
      "application-analysis-completed",
      "audit-interpreted",
      "forensic-correlation-completed",
      "report-generated",
      "evidence-archived",
    ]);
    expect(first.lineage_record.immutable).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateApplicationReplayAuditForensics(first).valid).toBe(true);
    expect(replayApplicationReplayAuditForensics(first)).toBe(true);
  });

  it("certifies governed requests, canonical evidence interpretation, reproducible reporting, and immutable lineage", () => {
    const result = runApplicationReplayAuditForensics();

    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
    expect(result.certification.replay_requests_governed).toBe(true);
    expect(result.certification.application_replay_analysis_operational).toBe(true);
    expect(result.certification.audit_interpretation_operational).toBe(true);
    expect(result.certification.forensic_reconstruction_deterministic).toBe(true);
    expect(result.certification.cross_application_correlation_functional).toBe(true);
    expect(result.certification.timeline_reconstruction_deterministic).toBe(true);
    expect(result.certification.reports_reproducible).toBe(true);
    expect(result.certification.immutable_lineage_preserved).toBe(true);
    expect(result.certification.no_replay_execution_logic).toBe(true);
    expect(result.certification.no_evidence_mutation).toBe(true);
    expect(result.certification.no_out_of_scope_ownership).toBe(true);
  });

  it.each([
    "P4_8_GOVERNANCE_BINDING_INVALID",
    "CCI_REPLAY_INFRASTRUCTURE_INVALID",
    "CCI_REPLAY_LEDGER_INVALID",
    "CCI_AUDIT_LEDGER_INVALID",
    "CCI_EVIDENCE_SERVICES_INVALID",
    "CCI_IMMUTABLE_STORAGE_INVALID",
    "CAF_BEHAVIORAL_REPLAY_INVALID",
    "CAF_DIVERGENCE_REPORTS_INVALID",
    "CAF_ASSURANCE_EVIDENCE_INVALID",
    "CAF_GOVERNANCE_EVIDENCE_INVALID",
    "REPLAY_REQUEST_UNAUTHORIZED",
    "REPLAY_REQUEST_MISSING",
    "REPLAY_SESSION_REFERENCE_MISSING",
    "CANONICAL_REPLAY_EVIDENCE_MISSING",
    "NON_CCI_REPLAY_EVIDENCE_USED",
    "CAF_REPLAY_EVIDENCE_MISSING",
    "REPLAY_ANALYSIS_NON_DETERMINISTIC",
    "REPLAY_ANALYSIS_REPORT_MISSING",
    "AUDIT_INTERPRETATION_NON_DETERMINISTIC",
    "AUDIT_REPORT_MISSING",
    "FORENSIC_FINDING_MISSING",
    "FORENSIC_CONFIDENCE_INSUFFICIENT",
    "TIMELINE_NON_DETERMINISTIC",
    "TIMELINE_INCOMPLETE",
    "CORRELATION_MAP_MISSING",
    "CROSS_APPLICATION_CORRELATION_INVALID",
    "INVESTIGATION_REPORT_MISSING",
    "INVESTIGATION_LINEAGE_INCOMPLETE",
    "REPORT_NOT_REPRODUCIBLE",
    "EVIDENCE_REFERENCE_MUTATED",
    "REPLAY_EXECUTION_ATTEMPTED",
    "CCI_REPLAY_REPLACEMENT_ATTEMPTED",
    "CAF_REPLAY_REPLACEMENT_ATTEMPTED",
    "FORENSIC_STORAGE_ATTEMPTED",
    "AUDIT_HISTORY_MUTATION_ATTEMPTED",
  ] as const)("fails replay audit forensics certification for %s", (scenario: ApplicationReplayForensicsScenario) => {
    const result = runApplicationReplayAuditForensics({ scenario });
    const validation = validateApplicationReplayAuditForensics(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  }, 300000);

  it("supports pruned certification outcomes", () => {
    const result = runApplicationReplayAuditForensics({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
