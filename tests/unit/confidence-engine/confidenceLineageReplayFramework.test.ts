import { describe, expect, it } from "vitest";
import {
  buildConfidenceLineageRecord,
  buildLineageGraph,
  replayConfidenceLineage,
  verifyReplayHashes,
  reconstructChronology,
  ConfidenceLineageEngine,
  ConfidenceReplayEngine,
  type ConfidenceLineageRecord,
} from "@/services/confidence-engine/confidenceLineageReplayFramework";
import { buildGovernanceAwareCautionBridge } from "@/services/confidence-engine/governanceAwareCautionBridge";
import { evaluateRiskEscalation } from "@/services/confidence-engine/riskEscalationLayer";
import { evaluateScopeTightening } from "@/services/confidence-engine/scopeTighteningFramework";
import { buildDeterministicConfidenceFixture } from "@/tests/integration/confidence-engine/helpers";

function buildPhaseChain(overrides: {
  tenantId?: string;
  recommendationId?: string;
  crossTenantReplay?: boolean;
} = {}) {
  const tenantId = overrides.tenantId ?? "tenant-alpha";
  const recommendationId = overrides.recommendationId ?? "recommendation-53f";
  const fixture = buildDeterministicConfidenceFixture();
  const caution = buildGovernanceAwareCautionBridge({
    confidenceResult: fixture.result,
    confidenceClassification: fixture.result.score.classification,
    replayValidationState: "STABLE",
    governanceBindingState: "BOUND",
    lineageIntegrityState: "MATCHED",
    freezeState: "ACTIVE",
    revocationState: "NOT_REVOKED",
    proposalIntegrityState: "replay_verified",
    recommendationId,
  });
  const escalation = evaluateRiskEscalation({
    confidence_score: fixture.result.score.score,
    confidence_collapse: false,
    risk_score: 0.18,
    uncertainty_score: 0.12,
    lineage_integrity: "VALID",
    replay_integrity: "STABLE",
    governance_conflict: false,
    approval_instability: false,
    authority_ambiguity: false,
    policy_conflict: false,
    evidence_completeness: 1,
    recommendation_scope: "NARROW",
    tenant_id: tenantId,
    recommendation_id: recommendationId,
    timestamp: "2026-06-01T12:01:00.000Z",
    version: "risk-escalation/v1",
    lineage_tenant_id: tenantId,
    replay_tenant_id: overrides.crossTenantReplay ? "tenant-beta" : tenantId,
  });
  const containment = evaluateScopeTightening({
    recommendation_id: recommendationId,
    tenant_id: tenantId,
    confidence_score: escalation.confidence_score,
    risk_score: escalation.risk_score,
    uncertainty_score: escalation.uncertainty_score,
    escalation_pressure: escalation.escalation_pressure,
    recommended_escalation: escalation.recommended_escalation,
    governance_pressure: escalation.governance_pressure,
    lineage_integrity: escalation.lineage_integrity,
    replay_integrity: escalation.replay_integrity,
    authority_ambiguity: false,
    approval_instability: false,
    policy_conflict: false,
    recommendation_count: 3,
    branch_count: 2,
    optimization_depth: 1,
    alternative_paths: 2,
    timestamp: "2026-06-01T12:02:00.000Z",
    version: "scope-tightening/v1",
    lineage_tenant_id: tenantId,
    replay_tenant_id: tenantId,
  });

  const cautionRecord = buildConfidenceLineageRecord({
    source_phase: "GOVERNANCE_AWARE_CAUTION",
    tenant_id: tenantId,
    recommendation_id: recommendationId,
    phase_output: caution,
    timestamp: "2026-06-01T12:00:00.000Z",
    version: "governance-aware-caution/v1",
  });
  const escalationRecord = buildConfidenceLineageRecord({
    source_phase: "RISK_ESCALATION",
    tenant_id: tenantId,
    parent_lineage_ids: [cautionRecord.lineage_id],
    phase_output: escalation,
  });
  const containmentRecord = buildConfidenceLineageRecord({
    source_phase: "SCOPE_TIGHTENING",
    tenant_id: tenantId,
    parent_lineage_ids: [escalationRecord.lineage_id],
    phase_output: containment,
  });

  return Object.freeze({
    tenantId,
    recommendationId,
    caution,
    escalation,
    containment,
    records: Object.freeze([cautionRecord, escalationRecord, containmentRecord] as const),
  });
}

describe("confidenceLineageReplayFramework", () => {
  it("replays the same lineage deterministically", () => {
    const fixture = buildPhaseChain();
    const first = replayConfidenceLineage({
      tenant_id: fixture.tenantId,
      recommendation_id: fixture.recommendationId,
      lineage_records: fixture.records,
      replay_timestamp: "2026-06-01T12:03:00.000Z",
      version: "confidence-lineage-replay/v1",
    });
    const second = ConfidenceReplayEngine.replay({
      tenant_id: fixture.tenantId,
      recommendation_id: fixture.recommendationId,
      lineage_records: fixture.records,
      replay_timestamp: "2026-06-01T12:03:00.000Z",
      version: "confidence-lineage-replay/v1",
    });

    expect(first).toEqual(second);
    expect(first.replay_status).toBe("REPLAY_VERIFIED");
    expect(first.reconstructed_outputs.caution).toEqual(fixture.caution);
    expect(first.reconstructed_outputs.escalation).toEqual(fixture.escalation);
    expect(first.reconstructed_outputs.containment).toEqual(fixture.containment);
  });

  it("validates hashes deterministically", () => {
    const fixture = buildPhaseChain();
    const validation = verifyReplayHashes(fixture.records);

    expect(validation.valid).toBe(true);
    expect(validation.checked_hashes).toHaveLength(3);
    expect(validation.checked_hashes.every((item) => item.matched)).toBe(true);
  });

  it("reconstructs chronology with backward and forward tracing", () => {
    const fixture = buildPhaseChain();
    const graph = buildLineageGraph([...fixture.records].reverse());
    const chronology = reconstructChronology(graph.records);

    expect(graph.forward_trace).toEqual(fixture.records.map((record) => record.lineage_id));
    expect(graph.backward_trace).toEqual([...fixture.records].reverse().map((record) => record.lineage_id));
    expect(chronology.valid).toBe(true);
    expect(ConfidenceLineageEngine.buildGraph(fixture.records)).toEqual(graph);
  });

  it("preserves tenant isolation and blocks cross-tenant replay", () => {
    const fixture = buildPhaseChain();
    const crossTenant = Object.freeze({
      ...fixture.records[1],
      tenant_id: "tenant-beta",
    }) as ConfidenceLineageRecord;
    const result = replayConfidenceLineage({
      tenant_id: fixture.tenantId,
      recommendation_id: fixture.recommendationId,
      lineage_records: [fixture.records[0], crossTenant, fixture.records[2]],
      replay_timestamp: "2026-06-01T12:03:00.000Z",
      version: "confidence-lineage-replay/v1",
    });

    expect(result.replay_status).toBe("FREEZE_REPLAY_RESULT");
    expect(result.reason_codes).toContain("TENANT_MISMATCH");
    expect(result.certification.tenant_isolated).toBe(false);
  });

  it("fails closed when lineage is missing or partial", () => {
    const fixture = buildPhaseChain();
    const missing = replayConfidenceLineage({
      tenant_id: fixture.tenantId,
      recommendation_id: fixture.recommendationId,
      lineage_records: [],
      replay_timestamp: "2026-06-01T12:03:00.000Z",
      version: "confidence-lineage-replay/v1",
    });
    const partial = replayConfidenceLineage({
      tenant_id: fixture.tenantId,
      recommendation_id: fixture.recommendationId,
      lineage_records: [fixture.records[0], fixture.records[1]],
      replay_timestamp: "2026-06-01T12:03:00.000Z",
      version: "confidence-lineage-replay/v1",
    });

    expect(missing.replay_status).toBe("FAIL_REPLAY");
    expect(missing.reason_codes).toContain("LINEAGE_MISSING");
    expect(partial.replay_status).toBe("FAIL_REPLAY");
    expect(partial.reason_codes).toContain("PARTIAL_LINEAGE");
  });

  it("fails closed on hash mismatch", () => {
    const fixture = buildPhaseChain();
    const tampered = Object.freeze({
      ...fixture.records[2],
      output_hash: "sha256:tampered",
    }) as ConfidenceLineageRecord;
    const result = replayConfidenceLineage({
      tenant_id: fixture.tenantId,
      recommendation_id: fixture.recommendationId,
      lineage_records: [fixture.records[0], fixture.records[1], tampered],
      replay_timestamp: "2026-06-01T12:03:00.000Z",
      version: "confidence-lineage-replay/v1",
    });

    expect(result.replay_status).toBe("FAIL_REPLAY");
    expect(result.reason_codes).toContain("HASH_MISMATCH");
    expect(result.output_hash_validation.valid).toBe(false);
  });

  it("fails closed on version mismatch or missing policy references", () => {
    const fixture = buildPhaseChain();
    const missingVersion = Object.freeze({
      ...fixture.records[1],
      version: "",
    }) as ConfidenceLineageRecord;
    const missingPolicy = Object.freeze({
      ...fixture.records[2],
      policy_versions: [],
    }) as ConfidenceLineageRecord;
    const result = replayConfidenceLineage({
      tenant_id: fixture.tenantId,
      recommendation_id: fixture.recommendationId,
      lineage_records: [fixture.records[0], missingVersion, missingPolicy],
      replay_timestamp: "2026-06-01T12:03:00.000Z",
      version: "confidence-lineage-replay/v1",
    });

    expect(result.replay_status).toBe("FAIL_REPLAY");
    expect(result.reason_codes).toContain("VERSION_MISSING");
    expect(result.reason_codes).toContain("POLICY_REFERENCE_MISSING");
  });

  it("fails closed on broken chronology", () => {
    const fixture = buildPhaseChain();
    const brokenParent = Object.freeze({
      ...fixture.records[2],
      parent_lineage_ids: [],
    }) as ConfidenceLineageRecord;
    const result = replayConfidenceLineage({
      tenant_id: fixture.tenantId,
      recommendation_id: fixture.recommendationId,
      lineage_records: [fixture.records[0], fixture.records[1], brokenParent],
      replay_timestamp: "2026-06-01T12:03:00.000Z",
      version: "confidence-lineage-replay/v1",
    });

    expect(result.replay_status).toBe("FAIL_REPLAY");
    expect(result.reason_codes).toContain("CHRONOLOGY_BROKEN");
  });

  it("remains read-only and cannot generate authority", () => {
    const fixture = buildPhaseChain();
    const result = replayConfidenceLineage({
      tenant_id: fixture.tenantId,
      recommendation_id: fixture.recommendationId,
      lineage_records: fixture.records,
      replay_timestamp: "2026-06-01T12:03:00.000Z",
      version: "confidence-lineage-replay/v1",
    });

    expect(result.replay_mode).toBe("READ_ONLY");
    expect(result.advisory_only).toBe(true);
    expect(result.authority_changed).toBe(false);
    expect(result.mutation_performed).toBe(false);
    expect(result.execution_permitted).toBe(false);
    expect(result.may_execute).toBe(false);
    expect(result.may_schedule).toBe(false);
    expect(result.may_mutate_state).toBe(false);
    expect(result.may_change_approval).toBe(false);
    expect(result.may_change_authority).toBe(false);
    expect(result.may_route_workflow).toBe(false);
  });

  it("does not mutate lineage inputs", () => {
    const fixture = buildPhaseChain();
    const before = JSON.stringify(fixture.records);

    replayConfidenceLineage({
      tenant_id: fixture.tenantId,
      recommendation_id: fixture.recommendationId,
      lineage_records: fixture.records,
      replay_timestamp: "2026-06-01T12:03:00.000Z",
      version: "confidence-lineage-replay/v1",
    });

    expect(JSON.stringify(fixture.records)).toBe(before);
  });
});
