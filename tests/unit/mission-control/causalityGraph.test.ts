import { describe, expect, it } from "vitest";
import {
  buildTruthCausalityGraphRequest,
  sealTruthCausalityGraph,
} from "@/services/mission-control";
import type { TruthCausalityGraphInput } from "@/services/mission-control";

function baseCausality(overrides: Partial<TruthCausalityGraphInput> = {}) {
  return sealTruthCausalityGraph({
    request: buildTruthCausalityGraphRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-25T00:00:00.000Z",
    }),
    missionId: "mission-alpha",
    sourceObjectId: "policy-alpha",
    sourceObjectType: "POLICY",
    targetObjectId: "evaluation-alpha",
    targetObjectType: "EVALUATION",
    causalityType: "INFLUENCES",
    replayReferences: ["causality-replay-alpha"],
    influences: [{
      influence_id: "influence-alpha",
      influence_type: "policy influence",
      influence_source_id: "policy-alpha",
      influence_target_id: "evaluation-alpha",
      influence_rationale: "Policy influenced the evaluation outcome.",
    }],
    dependencies: [{
      dependency_id: "dependency-alpha",
      dependency_type: "POLICY_DEPENDENCY",
      dependency_source_id: "evaluation-alpha",
      dependency_target_id: "policy-alpha",
      dependency_rationale: "Evaluation depends on policy state.",
    }],
    rootCause: {
      root_cause_id: "root-cause-alpha",
      root_object_id: "policy-alpha",
      root_object_type: "POLICY",
      root_cause_rationale: "Policy was the originating governance cause.",
    },
    causalChain: [{
      object_id: "policy-alpha",
      object_type: "POLICY",
      causality_id: "causality-root-alpha",
    }, {
      object_id: "evaluation-alpha",
      object_type: "EVALUATION",
      causality_id: "causality-alpha",
    }],
    accessTenantId: "tenant-alpha",
    ...overrides,
  });
}

describe("causalityGraph", () => {
  it("creates deterministic certified causality", () => {
    const first = baseCausality();
    const second = baseCausality();

    expect(first).toEqual(second);
    expect(first.certification).toBe("PASS");
    expect(first.validation.reasonCodes).toContain("CAUSALITY_CONTRACT_VALID");
    expect(first.validation.reasonCodes).toContain("CERTIFICATION_PASS");
  });

  it("passes valid source registration and fails missing sources", () => {
    const valid = baseCausality();
    const missing = baseCausality({
      sourceObjectId: "",
      missingSourceDetected: true,
    });

    expect(valid.validation.reasonCodes).toContain("SOURCE_REGISTERED");
    expect(missing.certification).toBe("FAIL");
    expect(missing.validation.sourceRegistered).toBe(false);
    expect(missing.validation.reasonCodes).toContain("SOURCE_MISSING");
  });

  it("passes valid target registration and fails missing targets", () => {
    const valid = baseCausality();
    const missing = baseCausality({
      targetObjectId: "",
      missingTargetDetected: true,
    });

    expect(valid.validation.reasonCodes).toContain("TARGET_REGISTERED");
    expect(missing.certification).toBe("FAIL");
    expect(missing.validation.targetRegistered).toBe(false);
    expect(missing.validation.reasonCodes).toContain("TARGET_MISSING");
  });

  it("maps influence and fails missing influence", () => {
    const mapped = baseCausality();
    const missing = baseCausality({
      influences: [],
      missingInfluenceMappingDetected: true,
    });

    expect(mapped.validation.reasonCodes).toContain("INFLUENCE_MAPPED");
    expect(missing.certification).toBe("FAIL");
    expect(missing.validation.influenceMapped).toBe(false);
    expect(missing.validation.reasonCodes).toContain("INFLUENCE_MISSING");
  });

  it("maps dependency and fails dependency cycles", () => {
    const mapped = baseCausality();
    const cycle = baseCausality({
      dependencyCycleDetected: true,
    });

    expect(mapped.validation.reasonCodes).toContain("DEPENDENCY_MAPPED");
    expect(cycle.certification).toBe("FAIL");
    expect(cycle.validation.dependencyMapped).toBe(false);
    expect(cycle.validation.reasonCodes).toContain("DEPENDENCY_CYCLE_DETECTED");
  });

  it("fails unknown dependency mappings", () => {
    const result = baseCausality({
      unknownDependencyDetected: true,
    });

    expect(result.certification).toBe("FAIL");
    expect(result.validation.reasonCodes).toContain("DEPENDENCY_UNKNOWN");
  });

  it("identifies root cause and fails unresolved root cause", () => {
    const identified = baseCausality();
    const unresolved = baseCausality({
      rootCauseUnresolvedDetected: true,
    });

    expect(identified.validation.reasonCodes).toContain("ROOT_CAUSE_IDENTIFIED");
    expect(unresolved.certification).toBe("FAIL");
    expect(unresolved.validation.rootCauseIdentified).toBe(false);
    expect(unresolved.validation.reasonCodes).toContain("ROOT_CAUSE_UNRESOLVED");
  });

  it("resolves causal chain and fails causal traversal", () => {
    const resolved = baseCausality();
    const failed = baseCausality({
      causalChainFailureDetected: true,
    });

    expect(resolved.validation.reasonCodes).toContain("CAUSAL_CHAIN_RESOLVED");
    expect(failed.certification).toBe("FAIL");
    expect(failed.validation.reasonCodes).toContain("CAUSAL_CHAIN_FAILURE");
  });

  it("replays causality and fails replay mismatches", () => {
    const reproduced = baseCausality();
    const mismatch = baseCausality({
      replayMismatchDetected: true,
    });

    expect(reproduced.replay.replayResult).toBe("REPRODUCED");
    expect(reproduced.validation.reasonCodes).toContain("CAUSALITY_REPLAY_REPRODUCED");
    expect(mismatch.certification).toBe("FAIL");
    expect(mismatch.replay.replayResult).toBe("MISMATCH");
    expect(mismatch.validation.reasonCodes).toContain("CAUSALITY_REPLAY_MISMATCH");
  });

  it("blocks cross-tenant causality access", () => {
    const result = baseCausality({
      accessTenantId: "tenant-beta",
      crossTenantCausalityAccessDetected: true,
      crossTenantDependencyDetected: true,
      crossTenantInfluenceDetected: true,
      crossTenantReplayDetected: true,
    });

    expect(result.certification).toBe("FAIL");
    expect(result.validation.tenantIsolationValid).toBe(false);
    expect(result.visibility.tenantScoped).toBe(false);
    expect(result.validation.reasonCodes).toContain("TENANT_CAUSALITY_ISOLATION_FAILED");
  });

  it("allows conditional pass for documented observability gaps", () => {
    const result = baseCausality({
      observabilityGapDetected: true,
      reportingLimitationDetected: true,
      remediationDocumented: true,
    });

    expect(result.certification).toBe("CONDITIONAL_PASS");
    expect(result.validation.valid).toBe(true);
    expect(result.validation.reasonCodes).toContain("CERTIFICATION_CONDITIONAL_PASS");
  });

  it("fails closed when causality tries to become a control surface", () => {
    const result = baseCausality({
      executionRequested: true,
      authorityExpansionDetected: true,
    });

    expect(result.certification).toBe("FAIL");
    expect(result.validation.executionImpossible).toBe(false);
    expect(result.validation.authorityBounded).toBe(false);
    expect(result.executionAuthorized).toBe(false);
    expect(result.authorityMutationAllowed).toBe(false);
  });
});
