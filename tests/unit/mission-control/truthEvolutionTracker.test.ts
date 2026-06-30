import { describe, expect, it } from "vitest";
import {
  buildTruthEvolutionRequest,
  sealTruthEvolutionTracker,
} from "@/services/mission-control";
import type { TruthEvolutionInput, TruthEvolutionType } from "@/services/mission-control";

function baseEvolution(evolutionType: TruthEvolutionType = "MODIFICATION", overrides: Partial<TruthEvolutionInput> = {}) {
  return sealTruthEvolutionTracker({
    request: buildTruthEvolutionRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-25T00:30:00.000Z",
    }),
    truthRecordId: "truth-alpha",
    missionId: "mission-alpha",
    evolutionType,
    previousVersion: "truth/v1",
    currentVersion: "truth/v2",
    evolutionReason: "New governed evidence changed the truth record.",
    evidenceReferences: ["evidence-alpha"],
    replayReferences: ["evolution-replay-alpha"],
    version: {
      truth_version: "truth/v2",
      version_number: 2,
      version_state: evolutionType === "BRANCH" ? "BRANCHED" : "ACTIVE",
      version_timestamp: "2026-06-25T00:29:00.000Z",
      supersedes: "truth/v1",
      superseded_by: null,
    },
    lineage: {
      origin_truth_record_id: "truth-alpha",
      prior_evolution_id: "evolution-alpha-prior",
      modification_chain: ["evolution-alpha-prior"],
      supersession_chain: evolutionType === "SUPERSESSION" ? ["truth-beta"] : [],
      branch_ancestry: evolutionType === "BRANCH" ? ["truth-alpha"] : [],
      branch_descendants: [],
    },
    modification: evolutionType === "MODIFICATION" ? {
      before_state: "classification=unknown",
      after_state: "classification=verified",
      change_summary: "Classification changed.",
      change_rationale: "Evidence verified the claim.",
    } : undefined,
    supersession: evolutionType === "SUPERSESSION" ? {
      replacement_truth_record_id: "truth-beta",
      supersession_rationale: "Replacement truth corrects the old record.",
    } : undefined,
    branch: evolutionType === "BRANCH" ? {
      branch_id: "branch-alpha",
      branch_type: "EVIDENCE_BRANCH",
      branch_origin_truth_id: "truth-alpha",
      branch_rationale: "Alternative evidence path preserved.",
    } : undefined,
    accessTenantId: "tenant-alpha",
    ...overrides,
  });
}

describe("truthEvolutionTracker", () => {
  it("records deterministic truth modification", () => {
    const first = baseEvolution();
    const second = baseEvolution();

    expect(first).toEqual(second);
    expect(first.certification).toBe("PASS");
    expect(first.validation.reasonCodes).toContain("MODIFICATION_RECORDED");
    expect(first.validation.reasonCodes).toContain("CERTIFICATION_PASS");
  });

  it("fails missing modification history and prior state", () => {
    const missingHistory = baseEvolution("MODIFICATION", {
      missingModificationHistoryDetected: true,
    });
    const missingPrior = baseEvolution("MODIFICATION", {
      missingPriorStateDetected: true,
    });

    expect(missingHistory.certification).toBe("FAIL");
    expect(missingHistory.validation.reasonCodes).toContain("MODIFICATION_HISTORY_MISSING");
    expect(missingPrior.certification).toBe("FAIL");
    expect(missingPrior.validation.reasonCodes).toContain("PRIOR_STATE_MISSING");
  });

  it("records supersession and fails missing replacement truth", () => {
    const supersession = baseEvolution("SUPERSESSION");
    const missingReplacement = baseEvolution("SUPERSESSION", {
      missingReplacementTruthDetected: true,
      supersession: {
        replacement_truth_record_id: "",
        supersession_rationale: "Missing replacement.",
      },
    });

    expect(supersession.certification).toBe("PASS");
    expect(supersession.validation.reasonCodes).toContain("SUPERSESSION_RECORDED");
    expect(missingReplacement.certification).toBe("FAIL");
    expect(missingReplacement.validation.reasonCodes).toContain("REPLACEMENT_TRUTH_MISSING");
  });

  it("records branch history and fails orphaned branches", () => {
    const branch = baseEvolution("BRANCH");
    const orphaned = baseEvolution("BRANCH", {
      orphanedBranchDetected: true,
    });

    expect(branch.certification).toBe("PASS");
    expect(branch.validation.reasonCodes).toContain("BRANCH_RECORDED");
    expect(orphaned.certification).toBe("FAIL");
    expect(orphaned.validation.reasonCodes).toContain("ORPHANED_BRANCH_DETECTED");
  });

  it("fails unknown branch type", () => {
    const result = baseEvolution("BRANCH", {
      unknownBranchTypeDetected: true,
    });

    expect(result.certification).toBe("FAIL");
    expect(result.validation.reasonCodes).toContain("BRANCH_TYPE_UNKNOWN");
  });

  it("creates versions and fails duplicate versions", () => {
    const created = baseEvolution("VERSION_CREATED");
    const duplicate = baseEvolution("VERSION_CREATED", {
      priorVersions: ["truth/v2"],
    });

    expect(created.certification).toBe("PASS");
    expect(created.validation.reasonCodes).toContain("VERSION_CREATED");
    expect(duplicate.certification).toBe("FAIL");
    expect(duplicate.validation.reasonCodes).toContain("VERSION_DUPLICATE");
  });

  it("preserves lineage and fails broken lineage", () => {
    const preserved = baseEvolution();
    const broken = baseEvolution("MODIFICATION", {
      brokenLineageDetected: true,
    });

    expect(preserved.validation.reasonCodes).toContain("LINEAGE_PRESERVED");
    expect(broken.certification).toBe("FAIL");
    expect(broken.validation.reasonCodes).toContain("LINEAGE_BROKEN");
  });

  it("replays truth evolution and fails replay mismatch", () => {
    const reproduced = baseEvolution();
    const mismatch = baseEvolution("MODIFICATION", {
      replayMismatchDetected: true,
    });

    expect(reproduced.replay.replayResult).toBe("REPRODUCED");
    expect(reproduced.validation.reasonCodes).toContain("TRUTH_EVOLUTION_REPLAY_REPRODUCED");
    expect(mismatch.certification).toBe("FAIL");
    expect(mismatch.replay.replayResult).toBe("MISMATCH");
    expect(mismatch.validation.reasonCodes).toContain("TRUTH_EVOLUTION_REPLAY_MISMATCH");
  });

  it("blocks cross-tenant truth access", () => {
    const result = baseEvolution("MODIFICATION", {
      accessTenantId: "tenant-beta",
      crossTenantTruthAccessDetected: true,
      crossTenantBranchDetected: true,
      crossTenantLineageDetected: true,
      crossTenantReplayDetected: true,
    });

    expect(result.certification).toBe("FAIL");
    expect(result.validation.tenantIsolationValid).toBe(false);
    expect(result.visibility.tenantScoped).toBe(false);
    expect(result.validation.reasonCodes).toContain("TENANT_TRUTH_ISOLATION_FAILED");
  });

  it("allows conditional pass for documented observability gaps", () => {
    const result = baseEvolution("MODIFICATION", {
      observabilityGapDetected: true,
      reportingLimitationDetected: true,
      remediationDocumented: true,
    });

    expect(result.certification).toBe("CONDITIONAL_PASS");
    expect(result.validation.valid).toBe(true);
    expect(result.validation.reasonCodes).toContain("CERTIFICATION_CONDITIONAL_PASS");
  });

  it("fails closed when evolution tries to become a control surface", () => {
    const result = baseEvolution("MODIFICATION", {
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
