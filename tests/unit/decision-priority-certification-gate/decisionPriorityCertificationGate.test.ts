import { describe, expect, it } from "vitest";
import {
  buildDecisionPriorityCertificationObservability,
  certifyDecisionPriorityEngine,
  getDecisionPriorityCertificationGate,
  replayDecisionPriorityCertification,
} from "@/services/decision-priority-certification-gate";
import { writePriorityLedger } from "@/services/decision-priority-ledger";
import { explainPriorities } from "@/services/decision-priority-explanation-engine";
import { scoreDecisionPriorities } from "@/services/decision-priority-scoring-engine";

describe("Mission Control Phase 9.5.10 Decision Priority Certification Gate", () => {
  it("certifies the complete priority stack with PASS when every component is deterministic and replayable", () => {
    const first = certifyDecisionPriorityEngine();
    const second = certifyDecisionPriorityEngine();

    expect(first).toEqual(second);
    expect(first.gate_status).toBe("PASS");
    expect(first.progression_allowed).toBe(true);
    expect(first.certification.certification_reports).toHaveLength(14);
    expect(first.certification.priority_contract_status).toBe("PASS");
    expect(first.certification.scoring_status).toBe("PASS");
    expect(first.certification.ledger_status).toBe("PASS");
    expect(first.replay_record.replay_valid).toBe(true);
    expect(first.advisoryOnly).toBe(true);
  });

  it("returns conditional pass for documentation-only deficiencies while blocking progression", () => {
    const result = certifyDecisionPriorityEngine({ documentation_deficiency_refs: ["docs-operator-presentation-gap"] });

    expect(result.gate_status).toBe("CONDITIONAL_PASS");
    expect(result.progression_allowed).toBe(false);
    expect(result.failures).toEqual([]);
    expect(result.conditional_deficiencies).toContain("docs-operator-presentation-gap");
  });

  it("fails closed for hidden weighting, unauthorized execution, fail-open behavior, replay mismatch, and advisory violation", () => {
    const hidden = certifyDecisionPriorityEngine({ hidden_weighting_refs: ["hidden"] });
    const unauthorized = certifyDecisionPriorityEngine({ unauthorized_execution_refs: ["execute"] });
    const failOpen = certifyDecisionPriorityEngine({ fail_open_refs: ["fail-open"] });
    const advisory = certifyDecisionPriorityEngine({ advisory_only: false });
    const base = certifyDecisionPriorityEngine();
    const replayMismatch = certifyDecisionPriorityEngine({ expected_replay_hash: `${base.replay_hash}-wrong` });

    expect(hidden.failures).toContain("HIDDEN_WEIGHTING_LOGIC_DETECTED");
    expect(unauthorized.failures).toContain("UNAUTHORIZED_EXECUTION_AUTHORITY");
    expect(failOpen.failures).toContain("FAIL_OPEN_DETECTED");
    expect(advisory.failures).toContain("ADVISORY_ONLY_VIOLATION");
    expect(replayMismatch.failures).toContain("CERTIFICATION_REPLAY_MISMATCH");
    expect(hidden.gate_status).toBe("FAIL");
  });

  it("fails when ledger integrity, evidence lineage, governance lineage, replay, or tenant isolation fails", () => {
    const noEvidenceLedger = writePriorityLedger({ explanation_result: explainPriorities({ scoring_result: scoreDecisionPriorities({ candidates: [{ evidence_refs: [] }] }) }) });
    const noGovernanceLedger = writePriorityLedger({ explanation_result: explainPriorities({ scoring_result: scoreDecisionPriorities({ candidates: [{ governance_refs: [] }] }) }) });
    const tenantLedger = writePriorityLedger({ explanation_result: explainPriorities({ scoring_result: scoreDecisionPriorities({ candidates: [{ governance_refs: ["governance_tenant_beta_leak"] }] }) }) });
    const mutatedLedger = writePriorityLedger({ attempted_mutation_refs: ["mutation"] });

    const noEvidence = certifyDecisionPriorityEngine({ ledger_result: noEvidenceLedger });
    const noGovernance = certifyDecisionPriorityEngine({ ledger_result: noGovernanceLedger });
    const tenant = certifyDecisionPriorityEngine({ ledger_result: tenantLedger });
    const mutated = certifyDecisionPriorityEngine({ ledger_result: mutatedLedger });

    expect(noEvidence.failures).toContain("EVIDENCE_LINEAGE_INCOMPLETE");
    expect(noGovernance.failures).toContain("GOVERNANCE_BYPASS_DETECTED");
    expect(tenant.failures).toContain("TENANT_ISOLATION_FAILED");
    expect(mutated.failures).toContain("LEDGER_INTEGRITY_FAILED");
    expect(mutated.gate_status).toBe("FAIL");
  });

  it("replays certification output and reports observability", () => {
    const valid = certifyDecisionPriorityEngine();
    const invalid = certifyDecisionPriorityEngine({ unauthorized_execution_refs: ["execute"] });
    const replay = replayDecisionPriorityCertification(valid);
    const engine = getDecisionPriorityCertificationGate();
    const metrics = buildDecisionPriorityCertificationObservability([valid, invalid]);

    expect(replay.replay_valid).toBe(true);
    expect(replay.expected_hash).toBe(valid.replay_hash);
    expect(engine.engine_version).toBe("decision-priority-certification-gate/v1");
    expect(metrics.evaluations).toBe(2);
    expect(metrics.pass_count).toBe(1);
    expect(metrics.fail_count).toBe(1);
    expect(metrics.advisory_failures).toBe(1);
  });
});
