import { describe, expect, it } from "vitest";
import {
  ESCALATION_DESTINATION_PRIORITY,
  buildEscalationObservability,
  evaluateEscalationRules,
  generateEscalationRequest,
  getConflictEscalationWorkflowFoundation,
  queueEscalation,
  replayConflictEscalationWorkflow,
  runConflictEscalationWorkflow,
  selectEscalationDestinations,
  transitionEscalationLifecycle,
  validateEscalationRequest,
} from "@/services/decision-conflict-escalation-workflow";
import { arbitrateClassifiedConflicts, arbitrateClassification } from "@/services/decision-arbitration-rules-engine";
import { classifyDetectedConflict, generateConflictClassificationReport } from "@/services/decision-conflict-classification-engine";
import { registerConflict } from "@/services/decision-conflict-detection-contract";

describe("Mission Control Phase 9.6.6 Conflict Escalation Workflow", () => {
  it("publishes the escalation workflow foundation", () => {
    const foundation = getConflictEscalationWorkflowFoundation();

    expect(foundation.workflow_version).toBe("conflict-escalation-workflow/v1");
    expect(foundation.destinations).toEqual(["Operator", "Governance", "Certification", "Simulation", "Mission Review", "Recovery Review"]);
    expect(foundation.destination_priority).toBe(ESCALATION_DESTINATION_PRIORITY);
    expect(foundation.result.escalation_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("evaluates deterministic escalation rules from arbitration outcomes", () => {
    const result = arbitrateClassifiedConflicts();
    const governance = result.arbitrations.find((arbitration) => arbitration.arbitration_outcome === "ESCALATE_TO_GOVERNANCE")!;
    const evaluations = evaluateEscalationRules(governance);

    expect(evaluations.find((evaluation) => evaluation.rule_id === "policy_disagreement_rule")?.triggered).toBe(true);
    expect(selectEscalationDestinations(evaluations)).toEqual(["Governance"]);
  });

  it("routes multiple triggers according to canonical destination priority", () => {
    const conflict = registerConflict({ conflict_category: "Recommendation" }).conflict!;
    const classification = {
      ...classifyDetectedConflict(conflict),
      primary_category: "Forecast" as const,
      secondary_categories: ["Confidence", "Certification"] as const,
      governance_impact: "CRITICAL" as const,
      operator_visibility: "REQUIRED" as const,
      severity: "MEDIUM" as const,
      severity_score: 40,
    };
    const arbitration = arbitrateClassification(classification, generateConflictClassificationReport(conflict, classification));
    const evaluations = evaluateEscalationRules({ ...arbitration, arbitration_outcome: "REQUIRE_SIMULATION", governance_summary: "Governance impact CRITICAL controls lower-priority optimization.", operator_summary: "Operator authority required before proceeding.", tradeoff_metadata: ["certification", "confidence", "mission"] });

    expect(selectEscalationDestinations(evaluations)).toEqual(["Governance", "Certification", "Operator", "Mission Review", "Simulation"]);
  });

  it("generates complete escalation requests, queue entries, transitions, and ledgers", () => {
    const result = runConflictEscalationWorkflow();

    expect(result.escalation_status).toBe("PASS");
    expect(result.requests.length).toBeGreaterThan(0);
    expect(result.requests.every((request) => request.supporting_evidence.length > 0)).toBe(true);
    expect(result.queue).toHaveLength(result.requests.length);
    expect(result.transitions.every((transition) => transition.transition_valid)).toBe(true);
    expect(result.ledger_records).toHaveLength(result.requests.length);
  });

  it("maintains deterministic queue ordering", () => {
    const result = runConflictEscalationWorkflow();
    const destinations = result.queue.map((entry) => entry.destination);
    const sorted = [...destinations].sort((a, b) => ESCALATION_DESTINATION_PRIORITY.indexOf(a) - ESCALATION_DESTINATION_PRIORITY.indexOf(b));

    expect(destinations[0]).toBe("Governance");
    expect(destinations).toEqual(sorted);
  });

  it("supports no-escalation decisions without queueing", () => {
    const conflict = registerConflict({ conflict_category: "Recommendation" }).conflict!;
    const classification = {
      ...classifyDetectedConflict(conflict),
      primary_category: "Recommendation" as const,
      secondary_categories: [] as const,
      governance_impact: "NONE" as const,
      operator_visibility: "STANDARD" as const,
      severity: "MEDIUM" as const,
      severity_score: 40,
    };
    const arbitration = arbitrateClassification(classification, generateConflictClassificationReport(conflict, classification));
    const result = runConflictEscalationWorkflow({ arbitrations: [arbitration] });

    expect(arbitration.arbitration_outcome).toBe("RESOLVED");
    expect(result.escalation_status).toBe("NO_ESCALATION");
    expect(result.decision_type).toBe("NO_ESCALATION_REQUIRED");
    expect(result.requests).toHaveLength(0);
  });

  it("validates escalation request metadata and lifecycle transitions", () => {
    const arbitration = arbitrateClassifiedConflicts().arbitrations.find((item) => item.escalation_required)!;
    const evaluations = evaluateEscalationRules(arbitration);
    const request = generateEscalationRequest(arbitration, selectEscalationDestinations(evaluations)[0], evaluations);
    const queue = queueEscalation(request, arbitration);
    const valid = transitionEscalationLifecycle(queue, "VALIDATED");
    const invalid = transitionEscalationLifecycle(queue, "CLOSED");

    expect(validateEscalationRequest(request, queue, arbitration).validation_state).toBe("VALID");
    expect(valid.transition_valid).toBe(true);
    expect(invalid.transition_valid).toBe(false);
  });

  it("fails closed for unauthorized routing, missing arbitration, invalid destination, metadata omissions, and replay mismatch", () => {
    const unauthorized = runConflictEscalationWorkflow({ authorized_component: "unknown" });
    const empty = runConflictEscalationWorkflow({ arbitrations: [] });
    const valid = runConflictEscalationWorkflow();
    const mismatch = runConflictEscalationWorkflow({ replay_expected_hash: `${valid.replay_hash}_wrong` });
    const arbitration = arbitrateClassifiedConflicts().arbitrations.find((item) => item.escalation_required)!;
    const request = generateEscalationRequest(arbitration, "Governance", evaluateEscalationRules(arbitration));

    expect(unauthorized.failures).toContain("UNAUTHORIZED_ROUTING_ATTEMPT");
    expect(empty.failures).toContain("MISSING_ARBITRATION_RECORDS");
    expect(mismatch.failures).toContain("REPLAY_CORRUPTION");
    expect(validateEscalationRequest({ ...request, escalation_destination: "Unknown" as never }).failures).toContain("INVALID_ESCALATION_DESTINATION");
    expect(validateEscalationRequest({ ...request, governance_refs: [] }).failures).toContain("MISSING_GOVERNANCE_REFERENCES");
    expect(validateEscalationRequest({ ...request, constitutional_refs: [] }).failures).toContain("MISSING_CONSTITUTIONAL_METADATA");
    expect(validateEscalationRequest({ ...request, authority_refs: [] }).failures).toContain("INVALID_AUTHORITY_ASSIGNMENT");
  });

  it("replays escalation routing, queue, lifecycle, and ledger records", () => {
    const result = runConflictEscalationWorkflow();
    const replay = replayConflictEscalationWorkflow(result);
    const tampered = replayConflictEscalationWorkflow({ ...result, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.escalation_refs).toEqual(result.requests.map((request) => request.escalation_id));
    expect(replay.queue_refs).toEqual(result.queue.map((entry) => entry.queue_id));
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("REPLAY_CORRUPTION");
  });

  it("publishes escalation observability metrics", () => {
    const result = runConflictEscalationWorkflow();
    const metrics = buildEscalationObservability(result);

    expect(metrics.escalations_generated).toBe(result.requests.length);
    expect(metrics.governance_escalations).toBeGreaterThan(0);
    expect(metrics.queue_depth).toBe(result.queue.length);
    expect(metrics.average_routing_latency).toBe(1);
    expect(metrics.replay_success_rate).toBe(1);
    expect(metrics.validation_failures).toBe(0);
    expect(metrics.integrity_failures).toBe(0);
  });
});
