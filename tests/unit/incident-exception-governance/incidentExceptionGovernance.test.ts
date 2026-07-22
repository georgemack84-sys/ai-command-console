import { describe, expect, it } from "vitest";
import {
  getIncidentExceptionGovernanceBundle,
  replayIncidentExceptionGovernance,
  runIncidentExceptionGovernance,
  validateIncidentExceptionGovernance,
} from "@/services/incident-exception-governance";
import type { IncidentExceptionGovernanceFailure } from "@/types/incident-exception-governance";

describe("Mission Control Phase 16.8 Incident & Exception Governance", () => {
  it("publishes incident exception governance doctrine", () => {
    const bundle = getIncidentExceptionGovernanceBundle();

    expect(bundle.doctrine.version).toBe("incident-exception-governance/v16.8");
    expect(bundle.doctrine.upstream_phase).toBe("pilot-monitoring-observability/v16.7");
    expect(bundle.doctrine.categories).toEqual(["RUNTIME_FAILURE", "REPLAY_FAILURE", "GOVERNANCE_VIOLATION", "ADVISORY_BOUNDARY_VIOLATION", "TENANT_ISOLATION_VIOLATION", "EVIDENCE_INTEGRITY_VIOLATION", "DEPLOYMENT_INTEGRITY_VIOLATION", "OPERATOR_WORKFLOW_ISSUE"]);
    expect(bundle.doctrine.severities).toEqual(["INFORMATIONAL", "LOW", "MODERATE", "HIGH", "CRITICAL", "CONSTITUTIONAL_CRITICAL"]);
    expect(bundle.validation.valid).toBe(true);
  });

  it("defines deterministic incident taxonomy and classification policies", () => {
    const result = runIncidentExceptionGovernance();

    expect(result.classification_policy.categories).toHaveLength(8);
    expect(result.classification_policy.severities).toHaveLength(6);
    expect(result.classification_policy.escalation_rules).toHaveLength(9);
    expect(result.classification_policy.deterministic).toBe(true);
    expect(result.classification_policy.immutable).toBe(true);
  });

  it("records governed incident and exception workflow", () => {
    const result = runIncidentExceptionGovernance();

    expect(result.incident.current_lifecycle_state).toBe("CERTIFIED_CLOSED");
    expect(result.incident.resolution_status).toBe("RESOLVED");
    expect(result.incident.evidence_refs.length).toBeGreaterThan(0);
    expect(result.incident.replay_refs.length).toBeGreaterThan(0);
    expect(result.exception_workflow.deterministic).toBe(true);
    expect(result.exception_workflow.replayable).toBe(true);
  });

  it("evaluates deterministic escalation and governance review", () => {
    const result = runIncidentExceptionGovernance();

    expect(result.escalation.outcome).toBe("MONITOR");
    expect(result.escalation.deterministic).toBe(true);
    expect(result.escalation.governance_required).toBe(true);
    expect(result.escalation.fail_closed_available).toBe(true);
    expect(result.governance_review_queue.operational).toBe(true);
  });

  it("preserves reproducible root cause and certification impact", () => {
    const result = runIncidentExceptionGovernance();

    expect(result.root_cause_analysis.reproducible).toBe(true);
    expect(result.root_cause_analysis.immutable).toBe(true);
    expect(result.root_cause_analysis.affected_tenants).toEqual(["tenant_phase_16_incident_exception"]);
    expect(result.certification_interface.traceable).toBe(true);
    expect(result.certification_interface.certification_refs.length).toBeGreaterThan(0);
  });

  it("records immutable replayable timeline and evidence ledger", () => {
    const result = runIncidentExceptionGovernance();

    expect(result.timeline).toHaveLength(9);
    expect(result.timeline.every((entry, index) => entry.sequence === index + 1 && entry.immutable && entry.replayable && entry.evidence_refs.length > 0)).toBe(true);
    expect(result.evidence_ledger).toHaveLength(8);
    expect(result.evidence_ledger.every((entry, index) => entry.sequence === index + 1 && entry.append_only && entry.immutable && entry.replay_refs.length > 0 && entry.certification_refs.length > 0)).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runIncidentExceptionGovernance();
    const second = runIncidentExceptionGovernance();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateIncidentExceptionGovernance(first).valid).toBe(true);
    expect(replayIncidentExceptionGovernance(first)).toBe(true);
  });

  it("executes the Phase 16.8 incident certification matrix", () => {
    const result = runIncidentExceptionGovernance();

    expect(result.certification_tests).toHaveLength(11);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Incident taxonomy complete",
      "Escalation deterministic",
      "Forensic evidence preserved",
      "Incident lifecycle replayable",
      "Immutable incident evidence verified",
      "Governance review operational",
      "Root cause analysis reproducible",
      "Certification impact traceable",
      "Incident history immutable",
      "Constitutional guarantees preserved",
      "Phase 16.7 monitoring observability valid",
    ]);
  });

  it("supports conditional pass for non-constitutional incident warnings", () => {
    const result = runIncidentExceptionGovernance({ scenario: "NON_CONSTITUTIONAL_INCIDENT_WARNING" });
    const validation = validateIncidentExceptionGovernance(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it.each([
    "INCIDENT_TAXONOMY_INCOMPLETE",
    "ESCALATION_NON_DETERMINISTIC",
    "FORENSIC_EVIDENCE_NOT_PRESERVED",
    "INCIDENT_LIFECYCLE_NOT_REPLAYABLE",
    "IMMUTABLE_INCIDENT_EVIDENCE_NOT_VERIFIED",
    "GOVERNANCE_REVIEW_NOT_OPERATIONAL",
    "ROOT_CAUSE_ANALYSIS_NOT_REPRODUCIBLE",
    "CERTIFICATION_IMPACT_NOT_TRACEABLE",
    "INCIDENT_HISTORY_MUTABLE",
    "CONSTITUTIONAL_GUARANTEES_NOT_PRESERVED",
    "PHASE_16_7_MONITORING_NOT_VALID",
  ] as const)("fails certification for %s", (scenario: IncidentExceptionGovernanceFailure) => {
    const result = runIncidentExceptionGovernance({ scenario });
    const validation = validateIncidentExceptionGovernance(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested incident timeline tampering", () => {
    const result = runIncidentExceptionGovernance();
    const tampered = {
      ...result,
      timeline: [
        {
          ...result.timeline[0],
          immutable: false,
        },
        ...result.timeline.slice(1),
      ],
    };

    expect(validateIncidentExceptionGovernance(tampered).valid).toBe(false);
  });
});
