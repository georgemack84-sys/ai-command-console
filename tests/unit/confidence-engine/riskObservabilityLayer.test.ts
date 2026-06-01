import { describe, expect, it } from "vitest";
import {
  RiskObservabilityEngine,
  RiskTelemetryAggregator,
  buildRiskObservabilityRecord,
  correlateRiskOutputs,
  type RiskObservabilityRequest,
} from "@/services/confidence-engine/riskObservabilityLayer";
import {
  buildConfidenceLineageRecord,
  replayConfidenceLineage,
  type ConfidenceLineageRecord,
} from "@/services/confidence-engine/confidenceLineageReplayFramework";
import { buildGovernanceAwareCautionBridge } from "@/services/confidence-engine/governanceAwareCautionBridge";
import { evaluateRiskEscalation } from "@/services/confidence-engine/riskEscalationLayer";
import { evaluateScopeTightening } from "@/services/confidence-engine/scopeTighteningFramework";
import { buildDeterministicConfidenceFixture } from "@/tests/integration/confidence-engine/helpers";

function buildRequest(overrides: Partial<RiskObservabilityRequest> = {}): RiskObservabilityRequest {
  const tenantId = "tenant-alpha";
  const recommendationId = "recommendation-53g";
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

  return Object.freeze({
    tenant_id: tenantId,
    recommendation_id: recommendationId,
    confidence_output: confidence,
    escalation_output: escalation,
    containment_output: containment,
    replay_result: replay,
    visibility_permissions: ["risk-observability:read"],
    requested_at: "2026-06-01T13:04:00.000Z",
    version: "risk-observability/v1",
    ...overrides,
  } satisfies RiskObservabilityRequest);
}

describe("riskObservabilityLayer", () => {
  it("builds deterministic read-only views for identical inputs", () => {
    const request = buildRequest();
    const first = buildRiskObservabilityRecord(request);
    const second = RiskObservabilityEngine.build(request);

    expect(first).toEqual(second);
    expect(first.view.integrity_status).toBe("VISIBLE");
    expect(first.read_only).toBe(true);
    expect(first.advisory_only).toBe(true);
    expect(first.authority_changed).toBe(false);
    expect(first.mutation_performed).toBe(false);
  });

  it("correlates caution to escalation to containment to replay deterministically", () => {
    const request = buildRequest();
    const correlations = correlateRiskOutputs(request);

    expect(correlations).toHaveLength(4);
    expect(correlations.every((item) => item.valid)).toBe(true);
    expect(correlations).toEqual(correlateRiskOutputs(request));
  });

  it("exposes pressure progression, lineage, replay, and policy state", () => {
    const request = buildRequest();
    const record = buildRiskObservabilityRecord(request);

    expect(RiskTelemetryAggregator.aggregate(request)).toEqual(record.view.risk_state);
    expect(record.view.risk_state.pressure_progression.length).toBe(4);
    expect(record.view.lineage_state.complete).toBe(true);
    expect(record.view.lineage_state.backward_trace.length).toBe(3);
    expect(record.view.lineage_state.forward_trace.length).toBe(3);
    expect(record.view.replay_state.replay_status).toBe("REPLAY_VERIFIED");
    expect(record.view.policy_state.aligned).toBe(true);
  });

  it("preserves tenant isolation and blocks cross-tenant visibility", () => {
    const request = buildRequest();
    const crossTenantReplay = Object.freeze({
      ...request.replay_result,
      tenant_id: "tenant-beta",
    });
    const record = buildRiskObservabilityRecord({
      ...request,
      replay_result: crossTenantReplay,
    });

    expect(record.view.integrity_status).toBe("FREEZE_OBSERVABILITY_RESULT");
    expect(record.view.reason_codes).toContain("TENANT_MISMATCH");
    expect(record.certification.tenant_isolated).toBe(false);
  });

  it("fails closed when visibility permission is missing", () => {
    const record = buildRiskObservabilityRecord(buildRequest({
      visibility_permissions: [],
    }));

    expect(record.view.integrity_status).toBe("FREEZE_OBSERVABILITY_RESULT");
    expect(record.view.reason_codes).toContain("VISIBILITY_PERMISSION_MISSING");
  });

  it("degrades visibility on hash mismatch", () => {
    const request = buildRequest();
    const tamperedReplay = Object.freeze({
      ...request.replay_result,
      output_hash_validation: Object.freeze({
        ...request.replay_result.output_hash_validation,
        valid: false,
      }),
    });
    const record = buildRiskObservabilityRecord({
      ...request,
      replay_result: tamperedReplay,
    });

    expect(record.view.integrity_status).toBe("LIMIT_VISIBILITY");
    expect(record.view.reason_codes).toContain("HASH_MISMATCH");
    expect(record.view.hash_validation_status.output_hashes_valid).toBe(false);
  });

  it("fails closed on missing lineage or policy gaps", () => {
    const request = buildRequest();
    const incompleteReplay = Object.freeze({
      ...request.replay_result,
      policy_versions: [],
      lineage_chain: Object.freeze({
        ...request.replay_result.lineage_chain,
        records: [request.replay_result.lineage_chain.records[0]] as readonly ConfidenceLineageRecord[],
      }),
    });
    const record = buildRiskObservabilityRecord({
      ...request,
      replay_result: incompleteReplay,
    });

    expect(record.view.integrity_status).toBe("FREEZE_OBSERVABILITY_RESULT");
    expect(record.view.reason_codes).toContain("POLICY_MISSING");
    expect(record.view.reason_codes).toContain("LINEAGE_INCOMPLETE");
  });

  it("freezes observability on broken correlation", () => {
    const request = buildRequest();
    const mismatchedContainment = Object.freeze({
      ...request.containment_output,
      recommendation_id: "recommendation-other",
    });
    const record = buildRiskObservabilityRecord({
      ...request,
      containment_output: mismatchedContainment,
    });

    expect(record.view.integrity_status).toBe("FREEZE_OBSERVABILITY_RESULT");
    expect(record.view.reason_codes).toContain("RECOMMENDATION_MISMATCH");
    expect(record.view.reason_codes).toContain("CORRELATION_BROKEN");
  });

  it("introduces no execution or mutation paths", () => {
    const record = buildRiskObservabilityRecord(buildRequest());

    expect(record.execution_permitted).toBe(false);
    expect(record.may_execute).toBe(false);
    expect(record.may_schedule).toBe(false);
    expect(record.may_mutate_state).toBe(false);
    expect(record.may_approve).toBe(false);
    expect(record.may_change_authority).toBe(false);
    expect(record.may_route_workflow).toBe(false);
  });

  it("does not mutate source inputs", () => {
    const request = buildRequest();
    const before = JSON.stringify(request);

    buildRiskObservabilityRecord(request);

    expect(JSON.stringify(request)).toBe(before);
  });
});
