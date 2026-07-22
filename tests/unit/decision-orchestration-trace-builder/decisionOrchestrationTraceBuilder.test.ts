import { describe, expect, it } from "vitest";
import { captureDecisionReplaySnapshots } from "@/services/decision-replay-snapshot-capture";
import {
  ORCHESTRATION_EXECUTION_PHASES,
  REQUIRED_TRACE_EVENT_TYPES,
  buildDecisionOrchestrationTrace,
  computeTraceEventIntegrityHash,
  getDecisionOrchestrationTraceBuilderFoundation,
} from "@/services/decision-orchestration-trace-builder";

describe("Mission Control Phase 9.10.3 Orchestration Trace Builder", () => {
  it("publishes the trace builder foundation", () => {
    const foundation = getDecisionOrchestrationTraceBuilderFoundation();

    expect(foundation.trace_version).toBe("decision-orchestration-trace-builder/v1");
    expect(foundation.execution_phases).toEqual(ORCHESTRATION_EXECUTION_PHASES);
    expect(foundation.event_types).toEqual(REQUIRED_TRACE_EVENT_TYPES);
    expect(foundation.terminal_states).toContain("AVAILABLE_FOR_REPLAY");
    expect(foundation.result.validation.replay_ready).toBe(true);
  });

  it("builds a complete deterministic trace from intake through final decision", () => {
    const first = buildDecisionOrchestrationTrace();
    const second = buildDecisionOrchestrationTrace();

    expect(second).toEqual(first);
    expect(first.trace_record.trace_events.map((event) => event.event_type)).toEqual(REQUIRED_TRACE_EVENT_TYPES);
    expect(first.trace_record.execution_timeline.phase_sequence).toEqual([
      "INTAKE",
      "NORMALIZATION",
      "CONTEXT_BUILDING",
      "DEPENDENCY_ANALYSIS",
      "PRIORITIZATION",
      "ARBITRATION",
      "GOVERNANCE_VALIDATION",
      "PACKAGE_GENERATION",
      "OPERATOR_WORKFLOW",
      "FINALIZATION",
    ]);
  });

  it("creates deterministic timeline, dependencies, visualization, and ledger", () => {
    const result = buildDecisionOrchestrationTrace();

    expect(result.trace_record.execution_timeline.ordered_events).toEqual(result.trace_record.trace_events.map((event) => event.event_id));
    expect(result.trace_record.dependency_trace).toHaveLength(result.trace_record.trace_events.length - 1);
    expect(result.visualization.derived_from_trace).toBe(true);
    expect(result.visualization.operator_actions).toHaveLength(1);
    expect(result.ledger.every((entry, index) => entry.append_only && !entry.deleted && entry.sequence === index + 1)).toBe(true);
  });

  it("preserves lineage, replay, governance, constitutional refs, and integrity", () => {
    const result = buildDecisionOrchestrationTrace();

    expect(result.trace_record.trace_events.every((event) => event.lineage_refs.length > 0)).toBe(true);
    expect(result.trace_record.trace_events.every((event) => event.replay_refs.length > 0)).toBe(true);
    expect(result.trace_record.trace_events.every((event) => event.governance_refs.length > 0)).toBe(true);
    expect(result.trace_record.trace_events.every((event) => event.constitutional_refs.length > 0)).toBe(true);
    expect(result.trace_record.trace_events.every((event) => computeTraceEventIntegrityHash(event) === event.integrity_hash)).toBe(true);
  });

  it("derives trace identity from snapshot capture and preserves advisory boundaries", () => {
    const capture = captureDecisionReplaySnapshots();
    const result = buildDecisionOrchestrationTrace({ snapshot_capture: capture });

    expect(result.trace_identity.orchestration_id).toBe(capture.replay_contract.orchestration_id);
    expect(result.trace_identity.tenant_id).toBe(capture.replay_contract.tenant_id);
    expect(result.snapshot_capture).toBe(capture);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_original_orchestration).toBe(false);
  });

  it.each([
    ["MISSING_EVENT", "EXECUTION_STAGE_MISSING"],
    ["DUPLICATE_SEQUENCE", "DUPLICATE_SEQUENCE"],
    ["CORRUPTED_TRACE", "INTEGRITY_MISMATCH"],
    ["INCOMPLETE_LINEAGE", "INCOMPLETE_LINEAGE"],
    ["MISSING_REPLAY_REF", "REPLAY_REFS_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REFS_MISSING"],
    ["MISSING_CONSTITUTIONAL", "CONSTITUTIONAL_REFS_MISSING"],
    ["UNSUPPORTED_SCHEMA", "UNSUPPORTED_SCHEMA"],
    ["UNKNOWN_PHASE", "UNKNOWN_EXECUTION_PHASE"],
    ["CROSS_TENANT", "TENANT_MISMATCH"],
    ["DEPENDENCY_INCONSISTENCY", "DEPENDENCY_INCONSISTENCY"],
    ["LEDGER_FAILURE", "LEDGER_COMMIT_FAILURE"],
    ["ORDERING_INVALID", "EVENT_ORDERING_INVALID"],
  ] as const)("fails closed for %s", (scenario, failure) => {
    const result = buildDecisionOrchestrationTrace({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.replay_ready).toBe(false);
    expect(result.validation.failures).toContain(failure);
  });
});
