import { describe, expect, it } from "vitest";
import { runEscalationWorkflow } from "@/services/escalation-workflow";
import {
  REQUIRED_WORKFLOW_AUDIT_EVENTS,
  WORKFLOW_REPLAY_STATES,
  computeWorkflowAuditEventHash,
  computeWorkflowReplayRecordHash,
  computeWorkflowTimelineHash,
  createWorkflowAuditEvents,
  createWorkflowReplayRecord,
  createWorkflowTimelineRecord,
  getWorkflowAuditReplayFoundation,
  replayWorkflowAudit,
  runWorkflowAuditReplay,
} from "@/services/workflow-audit-replay";

const foundation = getWorkflowAuditReplayFoundation();
const baseEscalation = foundation.result.escalation_result;

describe("Mission Control Phase 9.9.8 Workflow Audit & Replay", () => {
  it("publishes the workflow audit replay foundation", () => {
    expect(foundation.audit_replay_version).toBe("workflow-audit-replay/v1");
    expect(foundation.replay_states).toEqual(WORKFLOW_REPLAY_STATES);
    expect(foundation.required_event_types).toEqual(REQUIRED_WORKFLOW_AUDIT_EVENTS);
    expect(foundation.result.audit_replay_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("records a deterministic, ordered, append-only workflow audit timeline", () => {
    const first = runWorkflowAuditReplay({ escalation_result: baseEscalation });
    const second = runWorkflowAuditReplay({ escalation_result: baseEscalation });

    expect(first).toEqual(second);
    expect(first.audit_events.map((event) => event.event_type)).toEqual(REQUIRED_WORKFLOW_AUDIT_EVENTS);
    expect(first.audit_events.map((event) => event.event_sequence)).toEqual(first.audit_events.map((_event, index) => index + 1));
    expect(first.timeline_record.event_count).toBe(REQUIRED_WORKFLOW_AUDIT_EVENTS.length);
    expect(first.audit_ledger[0]?.append_only).toBe(true);
  });

  it("reconstructs and certifies the workflow without re-executing workflow logic", () => {
    const result = runWorkflowAuditReplay({ escalation_result: baseEscalation });

    expect(result.replay_record.replay_status).toBe("CERTIFIED");
    expect(result.replay_record.reconstructed_state).toBe("ARCHIVED");
    expect(result.validation.replay_reconstructed).toBe(true);
    expect(result.validation.governance_history_present).toBe(true);
    expect(result.validation.constitutional_history_present).toBe(true);
    expect(result.validation.archive_event_present).toBe(true);
    expect(result.advisory_only).toBe(true);
  });

  it("fails closed for missing workflow, governance, constitutional, and archive events", () => {
    const events = createWorkflowAuditEvents(baseEscalation);
    const noGovernance = events.filter((event) => event.event_type !== "GOVERNANCE_VALIDATION");
    const noConstitutional = events.filter((event) => event.event_type !== "CONSTITUTIONAL_VALIDATION");
    const noArchive = events.filter((event) => event.event_type !== "ARCHIVE_ACTION");
    const empty = [] as typeof events;

    expect(runWorkflowAuditReplay({ escalation_result: baseEscalation, audit_events: empty }).failures).toEqual(expect.arrayContaining(["WORKFLOW_EVENT_MISSING", "TIMELINE_INCOMPLETE"]));
    expect(runWorkflowAuditReplay({ escalation_result: baseEscalation, audit_events: noGovernance }).failures).toEqual(expect.arrayContaining(["WORKFLOW_EVENT_MISSING", "GOVERNANCE_HISTORY_MISSING"]));
    expect(runWorkflowAuditReplay({ escalation_result: baseEscalation, audit_events: noConstitutional }).failures).toEqual(expect.arrayContaining(["WORKFLOW_EVENT_MISSING", "CONSTITUTIONAL_HISTORY_MISSING"]));
    expect(runWorkflowAuditReplay({ escalation_result: baseEscalation, audit_events: noArchive }).failures).toEqual(expect.arrayContaining(["WORKFLOW_EVENT_MISSING", "ARCHIVE_EVENT_MISSING"]));
  });

  it("fails closed for invalid ordering, duplicates, incomplete timelines, and replay reconstruction gaps", () => {
    const events = createWorkflowAuditEvents(baseEscalation);
    const badSequence = [{ ...events[0]!, event_sequence: 2, integrity_hash: computeWorkflowAuditEventHash({ ...events[0]!, event_sequence: 2 }) }, ...events.slice(1)];
    const duplicateEvents = [events[0]!, events[0]!, ...events.slice(2)];
    const timeline = createWorkflowTimelineRecord(events);
    const badTimeline = { ...timeline, event_count: 1, integrity_hash: computeWorkflowTimelineHash({ ...timeline, event_count: 1 }) };
    const replay = createWorkflowReplayRecord(events, timeline);
    const badReplay = { ...replay, reconstructed_state: "WORKFLOW_RESUMED", integrity_hash: computeWorkflowReplayRecordHash({ ...replay, reconstructed_state: "WORKFLOW_RESUMED" }) };

    expect(runWorkflowAuditReplay({ escalation_result: baseEscalation, audit_events: badSequence }).failures).toContain("EVENT_SEQUENCE_INVALID");
    expect(runWorkflowAuditReplay({ escalation_result: baseEscalation, audit_events: duplicateEvents }).failures).toContain("DUPLICATE_EVENT_DETECTED");
    expect(runWorkflowAuditReplay({ escalation_result: baseEscalation, timeline_record: badTimeline }).failures).toContain("TIMELINE_INCOMPLETE");
    expect(runWorkflowAuditReplay({ escalation_result: baseEscalation, replay_record: badReplay }).failures).toContain("REPLAY_RECONSTRUCTION_FAILED");
  });

  it("enforces escalation integration, tenant, replay, lineage, advisory-only, and integrity checks", () => {
    const badEscalation = runEscalationWorkflow({ authorized_component: "unknown" });
    const events = createWorkflowAuditEvents(baseEscalation);
    const badTenant = [{ ...events[0]!, tenant_id: "tenant_beta", integrity_hash: computeWorkflowAuditEventHash({ ...events[0]!, tenant_id: "tenant_beta" }) }, ...events.slice(1)];
    const missingReplay = [{ ...events[0]!, replay_ref: "", lineage_ref: "", integrity_hash: computeWorkflowAuditEventHash({ ...events[0]!, replay_ref: "", lineage_ref: "" }) }, ...events.slice(1)];
    const notAdvisory = [{ ...events[0]!, advisory_only: false as true, integrity_hash: computeWorkflowAuditEventHash({ ...events[0]!, advisory_only: false as true }) }, ...events.slice(1)];
    const tampered = [{ ...events[0]!, event_summary: "tampered" }, ...events.slice(1)];

    expect(runWorkflowAuditReplay({ escalation_result: badEscalation }).failures).toContain("ESCALATION_WORKFLOW_FAILED");
    expect(runWorkflowAuditReplay({ escalation_result: baseEscalation, audit_events: badTenant }).failures).toContain("TENANT_MISMATCH");
    expect(runWorkflowAuditReplay({ escalation_result: baseEscalation, audit_events: missingReplay }).failures).toEqual(expect.arrayContaining(["REPLAY_REFERENCE_UNAVAILABLE", "LINEAGE_INCOMPLETE"]));
    expect(runWorkflowAuditReplay({ escalation_result: baseEscalation, audit_events: notAdvisory }).failures).toContain("ADVISORY_ONLY_VIOLATION");
    expect(runWorkflowAuditReplay({ escalation_result: baseEscalation, audit_events: tampered }).failures).toContain("INTEGRITY_VERIFICATION_FAILED");
    expect(runWorkflowAuditReplay({ escalation_result: baseEscalation, authorized_component: "unknown" }).failures).toContain("UNAUTHORIZED_AUDIT_ACCESS");
  });

  it("replays audit records deterministically and detects replay divergence", () => {
    const valid = runWorkflowAuditReplay({ escalation_result: baseEscalation });
    const replay = replayWorkflowAudit(valid);
    const mismatch = runWorkflowAuditReplay({ escalation_result: baseEscalation, replay_expected_hash: `${valid.replay_hash}_wrong` });
    const tamperedReplay = replayWorkflowAudit({ ...valid, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.reconstructed_state).toBe("ARCHIVED");
    expect(mismatch.failures).toContain("REPLAY_DIVERGENCE");
    expect(tamperedReplay.replay_valid).toBe(false);
    expect(tamperedReplay.failures).toContain("REPLAY_DIVERGENCE");
  });
});
