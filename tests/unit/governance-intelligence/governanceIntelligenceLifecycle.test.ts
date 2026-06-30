import { describe, expect, it } from "vitest";
import {
  buildGovernanceLifecycleDoctrine,
  buildGovernanceLifecycleObservabilitySurface,
  buildGovernanceIntelligenceRecord,
  generateGovernanceIntelligenceIdentity,
  recordGovernanceLifecycleTransition,
  replayGovernanceLifecycle,
} from "@/services/governance-intelligence";
import type { GovernanceIntelligenceIdentity, GovernanceIntelligenceRecord, GovernanceLifecycleEvent, GovernanceLifecycleStage } from "@/types/governance-intelligence";

function pair(overrides: Partial<GovernanceIntelligenceRecord> = {}) {
  const identity = generateGovernanceIntelligenceIdentity();
  const record = buildGovernanceIntelligenceRecord({
    ...overrides,
    governance_intelligence_id: identity.governance_intelligence_id,
    tenant_id: identity.tenant_id,
    mission_id: identity.mission_id,
    created_timestamp: identity.created_timestamp,
  });
  return { identity, record };
}

function move(record: GovernanceIntelligenceRecord, identity: GovernanceIntelligenceIdentity, to_stage: GovernanceLifecycleStage, events: GovernanceLifecycleEvent[] = [], options = {}) {
  return recordGovernanceLifecycleTransition(record, identity, to_stage, events, options);
}

describe("Mission Control Phase 7A.4 Governance Intelligence Lifecycle", () => {
  it("defines lifecycle doctrine and stage-state mapping", () => {
    const doctrine = buildGovernanceLifecycleDoctrine();
    expect(doctrine.principles).toContain("state-driven");
    expect(doctrine.principles).toContain("identity-bound");
    expect(doctrine.stage_to_state.Creation).toBe("CREATED");
    expect(doctrine.stage_to_state.Archival).toBe("ARCHIVED");
  });

  it("records creation as CREATED", () => {
    const { identity, record } = pair();
    const creation = move(record, identity, "Creation");
    expect(creation.result.validation_status).toBe("PASS");
    expect(creation.result.final_state).toBe("CREATED");
    expect(creation.event.recorded_to_truth_ledger).toBe(true);
    expect(creation.event.lifecycle_event_hash).toBeTruthy();
  });

  it("fails creation without identity", () => {
    const { record } = pair();
    const result = recordGovernanceLifecycleTransition(record, undefined as never, "Creation");
    expect(result.result.validation_status).toBe("FAIL");
    expect(result.result.failure_reason).toBe("TRANSITION_EVENT_MISSING");
  });

  it("moves through standard lifecycle path", () => {
    const { identity, record } = pair();
    const events: GovernanceLifecycleEvent[] = [];
    const creation = move(record, identity, "Creation", events); events.push(creation.event);
    const analysis = move(creation.record, identity, "Analysis", events); events.push(analysis.event);
    const correlation = move(analysis.record, identity, "Correlation", events); events.push(correlation.event);
    const recommendation = move(correlation.record, identity, "Recommendation Generation", events); events.push(recommendation.event);
    const certifiedRecord = buildGovernanceIntelligenceRecord({ ...recommendation.record, certification_status: "PASS" });
    const certification = move(certifiedRecord, identity, "Certification", events, { certification_refs: ["cert_lifecycle_7a4"] }); events.push(certification.event);
    const archival = move(certification.record, identity, "Archival", events, { retention_policy_ref: "retention_policy_7a4" }); events.push(archival.event);

    expect(archival.result.validation_status).toBe("PASS");
    expect(archival.result.final_state).toBe("ARCHIVED");
    expect(events.map((event) => event.lifecycle_stage)).toEqual(["Creation", "Analysis", "Correlation", "Recommendation Generation", "Certification", "Archival"]);
  });

  it("moves through escalation lifecycle path", () => {
    const { identity, record } = pair();
    const events: GovernanceLifecycleEvent[] = [];
    const creation = move(record, identity, "Creation", events); events.push(creation.event);
    const analysis = move(creation.record, identity, "Analysis", events); events.push(analysis.event);
    const correlation = move(analysis.record, identity, "Correlation", events); events.push(correlation.event);
    const recommendation = move(correlation.record, identity, "Recommendation Generation", events); events.push(recommendation.event);
    const escalationRecord = buildGovernanceIntelligenceRecord({ ...recommendation.record, escalation_refs: ["esc_lifecycle_7a4"] });
    const escalation = move(escalationRecord, identity, "Escalation", events, { escalation_reason: "POLICY_CONFLICT" }); events.push(escalation.event);
    const certifiedRecord = buildGovernanceIntelligenceRecord({ ...escalation.record, certification_status: "PASS" });
    const certification = move(certifiedRecord, identity, "Certification", events, { certification_refs: ["cert_lifecycle_7a4"] });

    expect(escalation.result.validation_status).toBe("PASS");
    expect(certification.result.validation_status).toBe("PASS");
    expect(certification.result.final_state).toBe("CERTIFIED");
  });

  it("blocks lifecycle stage skipping and regression", () => {
    const { identity, record } = pair();
    const creation = move(record, identity, "Creation");
    const skipped = move(creation.record, identity, "Correlation", [creation.event]);
    expect(skipped.result.failure_reason).toBe("LIFECYCLE_STAGE_SKIPPED");
    const analysis = move(creation.record, identity, "Analysis", [creation.event]);
    const regression = move(analysis.record, identity, "Creation", [creation.event, analysis.event]);
    expect(regression.result.failure_reason).toBe("LIFECYCLE_STAGE_REGRESSION");
  });

  it("requires evidence, policy, lineage, and replay refs", () => {
    const base = pair();
    expect(move(buildGovernanceIntelligenceRecord({ ...base.record, evidence_refs: [] }), base.identity, "Creation").result.failure_reason).toBe("EVIDENCE_REFS_MISSING");
    expect(move(buildGovernanceIntelligenceRecord({ ...base.record, policy_refs: [] }), base.identity, "Creation").result.failure_reason).toBe("POLICY_REFS_MISSING");
    expect(move(buildGovernanceIntelligenceRecord({ ...base.record, lineage_refs: [] }), base.identity, "Creation").result.failure_reason).toBe("LINEAGE_REFS_MISSING");
    expect(move(buildGovernanceIntelligenceRecord({ ...base.record, replay_refs: [] }), base.identity, "Creation").result.failure_reason).toBe("REPLAY_REFS_MISSING");
  });

  it("requires escalation reason and refs", () => {
    const { identity, record } = pair({ intelligence_state: "RECOMMENDING" });
    const result = move(record, identity, "Escalation", [
      move(buildGovernanceIntelligenceRecord({ ...record, intelligence_state: "CREATED" }), identity, "Creation").event,
      move(buildGovernanceIntelligenceRecord({ ...record, intelligence_state: "CREATED" }), identity, "Analysis").event,
      move(buildGovernanceIntelligenceRecord({ ...record, intelligence_state: "ANALYZING" }), identity, "Correlation").event,
      move(buildGovernanceIntelligenceRecord({ ...record, intelligence_state: "CORRELATED" }), identity, "Recommendation Generation").event,
    ]);
    expect(result.result.failure_reason).toBe("POLICY_CONFLICT_UNESCALATED");
  });

  it("requires certification refs and pass status", () => {
    const { identity, record } = pair({ intelligence_state: "RECOMMENDING" });
    const result = move(record, identity, "Certification", [
      move(buildGovernanceIntelligenceRecord({ ...record, intelligence_state: "CREATED" }), identity, "Creation").event,
      move(buildGovernanceIntelligenceRecord({ ...record, intelligence_state: "CREATED" }), identity, "Analysis").event,
      move(buildGovernanceIntelligenceRecord({ ...record, intelligence_state: "ANALYZING" }), identity, "Correlation").event,
      move(buildGovernanceIntelligenceRecord({ ...record, intelligence_state: "CORRELATED" }), identity, "Recommendation Generation").event,
    ]);
    expect(result.result.failure_reason).toBe("CERTIFICATION_PRECONDITION_FAILED");
  });

  it("blocks archival before certification", () => {
    const { identity, record } = pair({ intelligence_state: "RECOMMENDING", certification_status: "PASS" });
    const result = move(record, identity, "Archival", [], { retention_policy_ref: "retention_policy_7a4" });
    expect(result.result.validation_status).toBe("FAIL");
    expect(result.result.failure_reason).toBe("LIFECYCLE_STAGE_MISSING");
  });

  it("records timestamp, actor, refs, and hashes", () => {
    const { identity, record } = pair();
    const result = move(record, identity, "Creation", [], { actor: "operator_alpha" });
    expect(result.event.timestamp).toBeTruthy();
    expect(result.event.actor).toBe("operator_alpha");
    expect(result.event.evidence_refs).toEqual(record.evidence_refs);
    expect(result.event.policy_refs).toEqual(record.policy_refs);
    expect(result.event.lineage_refs).toEqual(record.lineage_refs);
    expect(result.event.replay_refs).toEqual(record.replay_refs);
    expect(result.event.lifecycle_event_hash).toBeTruthy();
  });

  it("replays lifecycle path", () => {
    const { identity, record } = pair();
    const events: GovernanceLifecycleEvent[] = [];
    const creation = move(record, identity, "Creation", events); events.push(creation.event);
    const analysis = move(creation.record, identity, "Analysis", events); events.push(analysis.event);
    const correlation = move(analysis.record, identity, "Correlation", events); events.push(correlation.event);
    const replay = replayGovernanceLifecycle(record, events);
    expect(replay.validation_result).toBe("PASS");
    expect(replay.reconstructed_lifecycle_path).toEqual(["Creation", "Analysis", "Correlation"]);
    expect(replay.final_state).toBe("CORRELATED");
  });

  it("detects lifecycle replay mismatch", () => {
    const { identity, record } = pair();
    const creation = move(record, identity, "Creation");
    const tampered = { ...creation.event, lifecycle_event_hash: "tampered_hash" };
    const replay = replayGovernanceLifecycle(record, [tampered]);
    expect(replay.validation_result).toBe("FAIL");
    expect(replay.failure_reason).toBe("LIFECYCLE_REPLAY_MISMATCH");
  });

  it("builds lifecycle observability surface", () => {
    const { identity, record } = pair();
    const creation = move(record, identity, "Creation");
    const analysis = move(creation.record, identity, "Analysis", [creation.event]);
    const surface = buildGovernanceLifecycleObservabilitySurface(analysis.record, [creation.event, analysis.event]);
    expect(surface.current_lifecycle_stage).toBe("Analysis");
    expect(surface.current_state).toBe("ANALYZING");
    expect(surface.stage_timeline).toEqual(["Creation", "Analysis"]);
    expect(surface.recommendation_history).toEqual(record.recommendation_refs);
  });
});
