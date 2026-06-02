import { describe, expect, it } from "vitest";
import {
  buildConfidenceLineageRecord,
  replayConfidenceLineage,
} from "@/services/confidence-engine/confidenceLineageReplayFramework";
import { buildGovernanceAwareCautionBridge } from "@/services/confidence-engine/governanceAwareCautionBridge";
import {
  ContainmentExplanationService,
  EscalationExplanationService,
  LineageSummaryService,
  OperatorPriorityProjectionService,
  OperatorRiskVisibilityEngine,
  ReplaySummaryService,
  RiskExplanationService,
  buildOperatorRiskTimeline,
  buildOperatorRiskVisibilityRecord,
  type OperatorRiskVisibilityRequest,
} from "@/services/confidence-engine/operatorRiskVisibilityLayer";
import { buildRiskObservabilityRecord, type RiskObservabilityRecord } from "@/services/confidence-engine/riskObservabilityLayer";
import { evaluateRiskEscalation } from "@/services/confidence-engine/riskEscalationLayer";
import { evaluateScopeTightening } from "@/services/confidence-engine/scopeTighteningFramework";
import { buildDeterministicConfidenceFixture } from "@/tests/integration/confidence-engine/helpers";

function buildObservabilityRecord(overrides: Partial<RiskObservabilityRecord> = {}): RiskObservabilityRecord {
  const tenantId = "tenant-alpha";
  const recommendationId = "recommendation-53h";
  const fixture = buildDeterministicConfidenceFixture();
  const confidence = buildGovernanceAwareCautionBridge({
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
    risk_score: 0.22,
    uncertainty_score: 0.15,
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
    timestamp: "2026-06-01T13:01:00.000Z",
    version: "risk-escalation/v1",
    lineage_tenant_id: tenantId,
    replay_tenant_id: tenantId,
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
    timestamp: "2026-06-01T13:02:00.000Z",
    version: "scope-tightening/v1",
    lineage_tenant_id: tenantId,
    replay_tenant_id: tenantId,
  });
  const confidenceRecord = buildConfidenceLineageRecord({
    source_phase: "GOVERNANCE_AWARE_CAUTION",
    tenant_id: tenantId,
    recommendation_id: recommendationId,
    phase_output: confidence,
    timestamp: "2026-06-01T13:00:00.000Z",
    version: "governance-aware-caution/v1",
  });
  const escalationRecord = buildConfidenceLineageRecord({
    source_phase: "RISK_ESCALATION",
    tenant_id: tenantId,
    parent_lineage_ids: [confidenceRecord.lineage_id],
    phase_output: escalation,
  });
  const containmentRecord = buildConfidenceLineageRecord({
    source_phase: "SCOPE_TIGHTENING",
    tenant_id: tenantId,
    parent_lineage_ids: [escalationRecord.lineage_id],
    phase_output: containment,
  });
  const replay = replayConfidenceLineage({
    tenant_id: tenantId,
    recommendation_id: recommendationId,
    lineage_records: [confidenceRecord, escalationRecord, containmentRecord],
    replay_timestamp: "2026-06-01T13:03:00.000Z",
    version: "confidence-lineage-replay/v1",
  });
  const record = buildRiskObservabilityRecord({
    tenant_id: tenantId,
    recommendation_id: recommendationId,
    confidence_output: confidence,
    escalation_output: escalation,
    containment_output: containment,
    replay_result: replay,
    visibility_permissions: ["risk-observability:read"],
    requested_at: "2026-06-01T13:04:00.000Z",
    version: "risk-observability/v1",
  });

  return Object.freeze({
    ...record,
    ...overrides,
  });
}

function buildRequest(overrides: Partial<OperatorRiskVisibilityRequest> = {}): OperatorRiskVisibilityRequest {
  const record = buildObservabilityRecord();

  return Object.freeze({
    tenant_id: record.view.tenant_id,
    recommendation_id: record.view.recommendation_id,
    observability_record: record,
    operator_permissions: ["operator-risk:read"],
    requested_at: "2026-06-01T13:05:00.000Z",
    version: "operator-risk-visibility/v1",
    ...overrides,
  } satisfies OperatorRiskVisibilityRequest);
}

function withView(
  record: RiskObservabilityRecord,
  viewOverrides: Partial<RiskObservabilityRecord["view"]>,
): RiskObservabilityRecord {
  return Object.freeze({
    ...record,
    view: Object.freeze({
      ...record.view,
      ...viewOverrides,
    }),
  });
}

describe("operatorRiskVisibilityLayer", () => {
  it("builds deterministic read-only operator summaries for identical inputs", () => {
    const request = buildRequest();
    const first = buildOperatorRiskVisibilityRecord(request);
    const second = OperatorRiskVisibilityEngine.build(request);

    expect(first).toEqual(second);
    expect(first.projection.visibility_status).toBe("VISIBLE");
    expect(first.projection.risk_priority).toBe("LOW");
    expect(first.read_only).toBe(true);
    expect(first.advisory_only).toBe(true);
    expect(first.authority_changed).toBe(false);
    expect(first.mutation_performed).toBe(false);
    expect(first.execution_permitted).toBe(false);
  });

  it("projects risk priority deterministically without changing authority", () => {
    const request = buildRequest();
    const frozenRecord = withView(request.observability_record, {
      containment_state: Object.freeze({
        ...request.observability_record.view.containment_state,
        containment_level: "FREEZE_RECOMMENDATIONS",
      }),
    });
    const visibility = buildOperatorRiskVisibilityRecord({
      ...request,
      observability_record: frozenRecord,
    });

    expect(visibility.projection.risk_priority).toBe("CRITICAL");
    expect(OperatorPriorityProjectionService.project({
      observabilityRecord: frozenRecord,
      visibilityStatus: "VISIBLE",
    })).toBe("CRITICAL");
    expect(visibility.may_execute).toBe(false);
    expect(visibility.may_route_workflow).toBe(false);
    expect(visibility.may_remediate).toBe(false);
  });

  it("reconstructs the operator timeline reproducibly", () => {
    const record = buildRequest().observability_record;
    const first = buildOperatorRiskTimeline(record);
    const second = buildOperatorRiskTimeline(record);

    expect(first).toEqual(second);
    expect(first.events.map((event) => event.phase)).toEqual([
      "CAUTION",
      "RISK_ESCALATION",
      "SCOPE_TIGHTENING",
      "REPLAY",
      "OBSERVABILITY",
    ]);
    expect(first.timeline_hash).toHaveLength(64);
  });

  it("replays summaries and explanations identically", () => {
    const request = buildRequest();
    const first = buildOperatorRiskVisibilityRecord(request);
    const second = buildOperatorRiskVisibilityRecord(request);

    expect(first.summary).toEqual(second.summary);
    expect(RiskExplanationService.explain(request.observability_record)).toBe(first.summary.risk_level_summary);
    expect(EscalationExplanationService.explain(request.observability_record)).toBe(first.summary.escalation_summary);
    expect(ContainmentExplanationService.explain(request.observability_record)).toBe(first.summary.containment_summary);
    expect(ReplaySummaryService.summarize(request.observability_record)).toBe(first.summary.replay_summary);
    expect(LineageSummaryService.summarize(request.observability_record)).toBe(first.summary.lineage_summary);
  });

  it("preserves tenant isolation and blocks cross-tenant operator visibility", () => {
    const record = buildOperatorRiskVisibilityRecord(buildRequest({
      tenant_id: "tenant-beta",
    }));

    expect(record.projection.visibility_status).toBe("FREEZE_OPERATOR_VIEW");
    expect(record.projection.reason_chain.map((entry) => entry.code)).toContain("TENANT_MISMATCH");
    expect(record.certification.tenant_isolated).toBe(false);
    expect(record.certification.certified).toBe(false);
  });

  it("fails closed when operator permission is missing", () => {
    const record = buildOperatorRiskVisibilityRecord(buildRequest({
      operator_permissions: [],
    }));

    expect(record.projection.visibility_status).toBe("FREEZE_OPERATOR_VIEW");
    expect(record.projection.reason_chain.map((entry) => entry.code)).toContain("VISIBILITY_PERMISSION_MISSING");
  });

  it("limits visibility for incomplete lineage, invalid replay, and hash mismatch", () => {
    const request = buildRequest();
    const limitedRecord = withView(request.observability_record, {
      lineage_state: Object.freeze({
        ...request.observability_record.view.lineage_state,
        complete: false,
      }),
      replay_state: Object.freeze({
        ...request.observability_record.view.replay_state,
        replay_status: "FAIL_REPLAY",
      }),
      hash_validation_status: Object.freeze({
        input_hashes_valid: true,
        output_hashes_valid: false,
      }),
    });
    const record = buildOperatorRiskVisibilityRecord({
      ...request,
      observability_record: limitedRecord,
    });
    const reasonCodes = record.projection.reason_chain.map((entry) => entry.code);

    expect(record.projection.visibility_status).toBe("LIMIT_VISIBILITY");
    expect(reasonCodes).toContain("LINEAGE_INCOMPLETE");
    expect(reasonCodes).toContain("REPLAY_INVALID");
    expect(reasonCodes).toContain("HASH_MISMATCH");
  });

  it("freezes the operator view when policy is unavailable", () => {
    const request = buildRequest();
    const noPolicyRecord = withView(request.observability_record, {
      policy_state: Object.freeze({
        policy_versions: Object.freeze([]),
        weight_versions: request.observability_record.view.policy_state.weight_versions,
        aligned: false,
      }),
    });
    const record = buildOperatorRiskVisibilityRecord({
      ...request,
      observability_record: noPolicyRecord,
    });

    expect(record.projection.visibility_status).toBe("FREEZE_OPERATOR_VIEW");
    expect(record.projection.reason_chain.map((entry) => entry.code)).toContain("POLICY_UNAVAILABLE");
  });

  it("preserves deterministic lineage summaries", () => {
    const record = buildRequest().observability_record;
    const lineageSummary = LineageSummaryService.summarize(record);

    expect(lineageSummary).toBe(LineageSummaryService.summarize(record));
    expect(lineageSummary).toContain(record.view.lineage_state.chain_hash);
    expect(record.view.lineage_state.backward_trace.length).toBe(3);
  });

  it("introduces no execution, mutation, approval, remediation, or authority paths", () => {
    const record = buildOperatorRiskVisibilityRecord(buildRequest());

    expect(record.may_execute).toBe(false);
    expect(record.may_schedule).toBe(false);
    expect(record.may_mutate_state).toBe(false);
    expect(record.may_approve).toBe(false);
    expect(record.may_change_authority).toBe(false);
    expect(record.may_route_workflow).toBe(false);
    expect(record.may_remediate).toBe(false);
  });

  it("does not mutate source observability inputs", () => {
    const request = buildRequest();
    const before = JSON.stringify(request);

    buildOperatorRiskVisibilityRecord(request);

    expect(JSON.stringify(request)).toBe(before);
  });
});
