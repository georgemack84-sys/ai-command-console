import { describe, expect, it } from "vitest";
import {
  buildConfidenceLineageRecord,
  replayConfidenceLineage,
  type ConfidenceLineageRecord,
  type ConfidenceReplayResult,
} from "@/services/confidence-engine/confidenceLineageReplayFramework";
import {
  buildFailClosedUncertaintyRecord,
  type FailClosedUncertaintyRecord,
  type UncertaintyType,
} from "@/services/confidence-engine/failClosedUncertaintyFramework";
import {
  buildGovernanceAwareCautionBridge,
  type GovernanceAwareCautionBridgeResult,
} from "@/services/confidence-engine/governanceAwareCautionBridge";
import {
  buildOperatorRiskVisibilityRecord,
  type OperatorRiskVisibilityRecord,
} from "@/services/confidence-engine/operatorRiskVisibilityLayer";
import {
  AuthorityContainmentValidator,
  CertificationHashValidator,
  CrossPhaseIntegrityValidator,
  RiskCertificationGate,
  buildRiskCertificationRecord,
  type RiskCertificationRequest,
} from "@/services/confidence-engine/riskCertificationGate";
import {
  buildRiskObservabilityRecord,
  type RiskObservabilityRecord,
} from "@/services/confidence-engine/riskObservabilityLayer";
import { evaluateRiskEscalation, type EscalationRecommendation } from "@/services/confidence-engine/riskEscalationLayer";
import { evaluateScopeTightening, type ContainmentRecommendation } from "@/services/confidence-engine/scopeTighteningFramework";
import { buildDeterministicConfidenceFixture } from "@/tests/integration/confidence-engine/helpers";

type Chain = Readonly<{
  caution: GovernanceAwareCautionBridgeResult;
  escalation: EscalationRecommendation;
  containment: ContainmentRecommendation;
  lineageRecords: readonly ConfidenceLineageRecord[];
  replay: ConfidenceReplayResult;
  observability: RiskObservabilityRecord;
  operator: OperatorRiskVisibilityRecord;
  uncertainty: FailClosedUncertaintyRecord;
}>;

function buildChain(uncertaintyType: UncertaintyType = "CONFIDENCE_COLLAPSE"): Chain {
  const tenantId = "tenant-alpha";
  const recommendationId = "recommendation-53j";
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
    timestamp: "2026-06-02T13:01:00.000Z",
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
    timestamp: "2026-06-02T13:02:00.000Z",
    version: "scope-tightening/v1",
    lineage_tenant_id: tenantId,
    replay_tenant_id: tenantId,
  });
  const cautionRecord = buildConfidenceLineageRecord({
    source_phase: "GOVERNANCE_AWARE_CAUTION",
    tenant_id: tenantId,
    recommendation_id: recommendationId,
    phase_output: caution,
    timestamp: "2026-06-02T13:00:00.000Z",
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
  const lineageRecords = [cautionRecord, escalationRecord, containmentRecord] as const;
  const replay = replayConfidenceLineage({
    tenant_id: tenantId,
    recommendation_id: recommendationId,
    lineage_records: lineageRecords,
    replay_timestamp: "2026-06-02T13:03:00.000Z",
    version: "confidence-lineage-replay/v1",
  });
  const observability = buildRiskObservabilityRecord({
    tenant_id: tenantId,
    recommendation_id: recommendationId,
    confidence_output: caution,
    escalation_output: escalation,
    containment_output: containment,
    replay_result: replay,
    visibility_permissions: ["risk-observability:read"],
    requested_at: "2026-06-02T13:04:00.000Z",
    version: "risk-observability/v1",
  });
  const operator = buildOperatorRiskVisibilityRecord({
    tenant_id: tenantId,
    recommendation_id: recommendationId,
    observability_record: observability,
    operator_permissions: ["operator-risk:read"],
    requested_at: "2026-06-02T13:05:00.000Z",
    version: "operator-risk-visibility/v1",
  });
  const uncertainty = buildFailClosedUncertaintyRecord({
    tenant_id: tenantId,
    recommendation_id: recommendationId,
    signals: [
      {
        signal_id: "signal-53j",
        tenant_id: tenantId,
        recommendation_id: recommendationId,
        source_phase: "OPERATOR_RISK_VISIBILITY",
        uncertainty_type: uncertaintyType,
        trigger_source: "operator-risk-visibility/v1",
        source_hash: operator.visibility_hash,
        policy_references: ["operator-risk-visibility-policy/v1"],
        lineage_references: [operator.projection.timeline_summary.timeline_hash],
        replay_references: [operator.projection.timeline_summary.timeline_hash],
        reason_codes: [uncertaintyType],
        timestamp: "2026-06-02T13:06:00.000Z",
        version: "uncertainty-signal/v1",
      },
    ],
    timestamp: "2026-06-02T13:07:00.000Z",
    version: "fail-closed-uncertainty/v1",
    policy_version: "fail-closed-uncertainty-policy/v1",
  });

  return Object.freeze({
    caution,
    escalation,
    containment,
    lineageRecords,
    replay,
    observability,
    operator,
    uncertainty,
  });
}

function buildRequest(overrides: Partial<RiskCertificationRequest> = {}): RiskCertificationRequest {
  const chain = buildChain();

  return Object.freeze({
    tenant_id: "tenant-alpha",
    recommendation_id: "recommendation-53j",
    caution_output: chain.caution,
    escalation_output: chain.escalation,
    containment_output: chain.containment,
    lineage_records: chain.lineageRecords,
    replay_result: chain.replay,
    observability_record: chain.observability,
    operator_visibility_record: chain.operator,
    uncertainty_record: chain.uncertainty,
    timestamp: "2026-06-02T13:08:00.000Z",
    version: "risk-certification-gate/v1",
    ...overrides,
  } satisfies RiskCertificationRequest);
}

describe("riskCertificationGate", () => {
  it("certifies the complete 5.3 architecture with deterministic PASS", () => {
    const request = buildRequest();
    const first = buildRiskCertificationRecord(request);
    const second = RiskCertificationGate.certify(request);

    expect(first).toEqual(second);
    expect(first.result.certification_state).toBe("PASS");
    expect(first.result.failed_requirements).toEqual([]);
    expect(first.summary.phase_count).toBe(7);
    expect(first.read_only).toBe(true);
    expect(first.advisory_only).toBe(true);
  });

  it("produces deterministic CONDITIONAL_PASS for heightened fail-closed uncertainty", () => {
    const chain = buildChain("AUTHORITY_AMBIGUITY");
    const request = buildRequest({
      uncertainty_record: chain.uncertainty,
    });
    const record = buildRiskCertificationRecord(request);

    expect(record.result.certification_state).toBe("CONDITIONAL_PASS");
    expect(record.result.reason_codes).toContain("UNCERTAINTY_ESCALATED_CONDITION");
    expect(record.result.failed_requirements).toEqual([]);
    expect(record.summary.conditional_count).toBe(1);
  });

  it("fails deterministically on broken cross-phase lineage", () => {
    const request = buildRequest({
      lineage_records: buildRequest().lineage_records.slice(0, 2),
    });
    const record = buildRiskCertificationRecord(request);

    expect(record.result.certification_state).toBe("FAIL");
    expect(record.result.failed_requirements).toContain("lineage_completeness");
    expect(record.result.lineage_validation).toBe(false);
  });

  it("blocks cross-tenant certification", () => {
    const request = buildRequest({
      tenant_id: "tenant-beta",
    });
    const record = buildRiskCertificationRecord(request);

    expect(record.result.certification_state).toBe("FAIL");
    expect(record.result.failed_requirements).toContain("tenant_isolation");
    expect(record.result.reason_codes).toContain("TENANT_MISMATCH");
  });

  it("fails on hash mismatch", () => {
    const request = buildRequest();
    const tamperedOperator = Object.freeze({
      ...request.operator_visibility_record,
      visibility_hash: "tampered-operator-hash",
    });
    const record = buildRiskCertificationRecord({
      ...request,
      operator_visibility_record: tamperedOperator,
    });

    expect(CertificationHashValidator.validate({
      ...request,
      operator_visibility_record: tamperedOperator,
    })).toBe(false);
    expect(record.result.certification_state).toBe("FAIL");
    expect(record.result.failed_requirements).toContain("hash_integrity");
  });

  it("fails on replay mismatch", () => {
    const request = buildRequest();
    const tamperedReplay = Object.freeze({
      ...request.replay_result,
      replay_status: "FAIL_REPLAY" as const,
    });
    const record = buildRiskCertificationRecord({
      ...request,
      replay_result: tamperedReplay,
    });

    expect(record.result.certification_state).toBe("FAIL");
    expect(record.result.failed_requirements).toContain("replay_reproducibility");
    expect(record.result.replay_validation).toBe(false);
  });

  it("fails when authority containment is broken", () => {
    const request = buildRequest();
    const authorityLeakingEscalation = Object.freeze({
      ...request.escalation_output,
      may_execute: true,
    }) as EscalationRecommendation;
    const tamperedRequest = {
      ...request,
      escalation_output: authorityLeakingEscalation,
    };
    const record = buildRiskCertificationRecord(tamperedRequest);

    expect(AuthorityContainmentValidator.validate(tamperedRequest)).toBe(false);
    expect(record.result.certification_state).toBe("FAIL");
    expect(record.result.failed_requirements).toContain("authority_containment");
    expect(record.result.reason_codes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });

  it("validates every cross-phase link reproducibly", () => {
    const request = buildRequest();
    const first = CrossPhaseIntegrityValidator.validate(request);
    const second = CrossPhaseIntegrityValidator.validate(request);

    expect(first).toEqual(second);
    expect(first).toHaveLength(6);
    expect(first.every((result) => result.valid)).toBe(true);
  });

  it("keeps certification replayable and authority-neutral", () => {
    const record = buildRiskCertificationRecord(buildRequest());

    expect(record.result.replay_validation).toBe(true);
    expect(record.result.authority_validation).toBe(true);
    expect(record.execution_permitted).toBe(false);
    expect(record.mutation_performed).toBe(false);
    expect(record.authority_changed).toBe(false);
    expect(record.may_execute).toBe(false);
    expect(record.may_schedule).toBe(false);
    expect(record.may_mutate_state).toBe(false);
    expect(record.may_change_approval).toBe(false);
    expect(record.may_change_authority).toBe(false);
    expect(record.may_route_workflow).toBe(false);
    expect(record.may_remediate).toBe(false);
  });

  it("does not mutate source phase artifacts", () => {
    const request = buildRequest();
    const before = JSON.stringify(request);

    buildRiskCertificationRecord(request);

    expect(JSON.stringify(request)).toBe(before);
  });
});
