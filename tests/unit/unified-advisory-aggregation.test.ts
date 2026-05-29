import { describe, expect, it } from "vitest";

import { aggregateUnifiedAdvisory } from "../../services/advisory/index.ts";

function releaseCertification(overrides: Record<string, unknown> = {}) {
  return {
    status: "COMPATIBLE",
    commitSha: "abc123",
    certificateStatus: "VALID",
    evidenceHash: "sha256:release-evidence",
    artifactHash: "sha256:artifact",
    auditCertificationHash: "sha256:audit",
    governanceReplayHash: "sha256:replay",
    mappedArtifacts: [],
    schemaMismatches: [],
    replayEvidenceAvailable: true,
    authority: "READ_ONLY",
    mayBlockDeployment: false,
    mayTriggerRollback: false,
    mayTriggerRetry: false,
    reasons: [],
    ...overrides,
  };
}

function operationalRules(overrides: Record<string, unknown> = {}) {
  return {
    advisoryStatus: "SAFE",
    classification: "INFORMATIONAL",
    evidenceHash: "sha256:operational-evidence",
    ruleHash: "sha256:rule",
    ruleVersion: "operational-rules-advisory/v1",
    advisoryReasons: [],
    evidenceRefs: ["operational-rules:evaluation"],
    replayable: true,
    authority: "ADVISORY_ONLY",
    mayDeploy: false,
    mayRetry: false,
    mayRollback: false,
    mayCancel: false,
    mayResume: false,
    requiresExplicitEnforcementPhase: true,
    ...overrides,
  };
}

function deploymentOverrun(overrides: Record<string, unknown> = {}) {
  return {
    advisoryStatus: "NORMAL",
    risk: "LOW",
    evidenceHash: "sha256:overrun-evidence",
    advisoryHash: "sha256:overrun-advisory",
    evidenceRefs: ["deployment-overrun:evaluation"],
    advisoryReasons: [],
    durationMs: 1_000,
    replayable: true,
    authority: "ADVISORY_ONLY",
    mayCancel: false,
    mayRetry: false,
    mayRollback: false,
    mayResume: false,
    mayDeploy: false,
    requiresExplicitEnforcementPhase: true,
    ...overrides,
  };
}

function allSources(overrides: {
  releaseCertification?: Record<string, unknown> | null;
  operationalRules?: Record<string, unknown> | null;
  deploymentOverrun?: Record<string, unknown> | null;
} = {}) {
  return {
    releaseCertification: overrides.releaseCertification === null ? undefined : releaseCertification(overrides.releaseCertification),
    operationalRules: overrides.operationalRules === null ? undefined : operationalRules(overrides.operationalRules),
    deploymentOverrun: overrides.deploymentOverrun === null ? undefined : deploymentOverrun(overrides.deploymentOverrun),
  };
}

describe("unified advisory aggregation", () => {
  it("aggregates all sources into NORMAL and LOW", () => {
    const result = aggregateUnifiedAdvisory(allSources());

    expect(result.status).toBe("NORMAL");
    expect(result.risk).toBe("LOW");
    expect(result.sourceStatuses.map((source) => source.source)).toEqual([
      "RELEASE_CERTIFICATION",
      "OPERATIONAL_RULES",
      "DEPLOYMENT_OVERRUN",
    ]);
    expect(result.replayable).toBe(true);
  });

  it("uses the strictest status", () => {
    const result = aggregateUnifiedAdvisory(allSources({
      operationalRules: { advisoryStatus: "ESCALATE" },
      deploymentOverrun: { advisoryStatus: "WATCH", risk: "MEDIUM" },
    }));

    expect(result.status).toBe("ESCALATE");
    expect(result.reasons).toContain("STRICTEST_STATUS:ESCALATE");
  });

  it("uses the strictest risk", () => {
    const result = aggregateUnifiedAdvisory(allSources({
      deploymentOverrun: { advisoryStatus: "ESCALATE", risk: "CRITICAL" },
    }));

    expect(result.risk).toBe("CRITICAL");
    expect(result.reasons).toContain("STRICTEST_RISK:CRITICAL");
  });

  it("fails closed when release-certification source is missing", () => {
    const result = aggregateUnifiedAdvisory(allSources({ releaseCertification: null }));

    expect(result.status).toBe("FAILED");
    expect(result.risk).toBe("UNKNOWN");
    expect(result.conflicts).toContainEqual({
      source: "RELEASE_CERTIFICATION",
      reason: "SOURCE_MISSING",
    });
  });

  it("fails closed when operational-rules source is missing", () => {
    const result = aggregateUnifiedAdvisory(allSources({ operationalRules: null }));

    expect(result.status).toBe("FAILED");
    expect(result.conflicts).toContainEqual({
      source: "OPERATIONAL_RULES",
      reason: "SOURCE_MISSING",
    });
  });

  it("fails closed when deployment-overrun source is missing", () => {
    const result = aggregateUnifiedAdvisory(allSources({ deploymentOverrun: null }));

    expect(result.status).toBe("FAILED");
    expect(result.conflicts).toContainEqual({
      source: "DEPLOYMENT_OVERRUN",
      reason: "SOURCE_MISSING",
    });
  });

  it("disputes non-replayable source", () => {
    const result = aggregateUnifiedAdvisory(allSources({
      operationalRules: { replayable: false },
    }));

    expect(result.status).toBe("DISPUTED");
    expect(result.risk).toBe("UNKNOWN");
    expect(result.conflicts).toContainEqual({
      source: "OPERATIONAL_RULES",
      reason: "SOURCE_NOT_REPLAYABLE",
    });
  });

  it("disputes authority-shaped source input and contains mayDeploy", () => {
    const result = aggregateUnifiedAdvisory(allSources({
      operationalRules: { mayDeploy: true },
    }));
    const serialized = JSON.stringify(result);

    expect(result.status).toBe("DISPUTED");
    expect(result.risk).toBe("UNKNOWN");
    expect(result.mayDeploy).toBe(false);
    expect(result.conflicts).toContainEqual({
      source: "OPERATIONAL_RULES",
      reason: "AUTHORITY_LEAK:mayDeploy",
    });
    expect(serialized).not.toContain("\"mayDeploy\":true");
  });

  it("disputes mayCancel and mayRetry leaks", () => {
    const result = aggregateUnifiedAdvisory(allSources({
      deploymentOverrun: { mayCancel: true, mayRetry: true },
    }));

    expect(result.status).toBe("DISPUTED");
    expect(result.mayCancel).toBe(false);
    expect(result.mayRetry).toBe(false);
    expect(result.conflicts).toContainEqual({
      source: "DEPLOYMENT_OVERRUN",
      reason: "AUTHORITY_LEAK:mayCancel",
    });
    expect(result.conflicts).toContainEqual({
      source: "DEPLOYMENT_OVERRUN",
      reason: "AUTHORITY_LEAK:mayRetry",
    });
  });

  it("disputes conflicting source status and risk", () => {
    const result = aggregateUnifiedAdvisory(allSources({
      operationalRules: { advisoryStatus: "SAFE", risk: "CRITICAL" },
    }));

    expect(result.status).toBe("DISPUTED");
    expect(result.risk).toBe("UNKNOWN");
    expect(result.conflicts).toContainEqual({
      source: "OPERATIONAL_RULES",
      reason: "STATUS_RISK_CONTRADICTION:SAFE:CRITICAL",
    });
  });

  it("disputes unknown status", () => {
    const result = aggregateUnifiedAdvisory(allSources({
      deploymentOverrun: { advisoryStatus: "STRANGE" },
    }));

    expect(result.status).toBe("DISPUTED");
    expect(result.conflicts).toContainEqual({
      source: "DEPLOYMENT_OVERRUN",
      reason: "UNKNOWN_STATUS:STRANGE",
    });
  });

  it("unknown risk produces UNKNOWN", () => {
    const result = aggregateUnifiedAdvisory(allSources({
      deploymentOverrun: { risk: "STRANGE" },
    }));

    expect(result.status).toBe("DISPUTED");
    expect(result.risk).toBe("UNKNOWN");
    expect(result.conflicts).toContainEqual({
      source: "DEPLOYMENT_OVERRUN",
      reason: "UNKNOWN_RISK:STRANGE",
    });
  });

  it("normalizes evidence refs deterministically", () => {
    const first = aggregateUnifiedAdvisory(allSources({
      operationalRules: { evidenceRefs: ["b", "a", "a"] },
      deploymentOverrun: { evidenceRefs: ["c", "b"] },
    }));
    const second = aggregateUnifiedAdvisory(allSources({
      operationalRules: { evidenceRefs: ["a", "b"] },
      deploymentOverrun: { evidenceRefs: ["b", "c"] },
    }));

    expect(first.evidenceRefs).toEqual(["a", "b", "c"]);
    expect(first.evidenceRefs).toEqual(second.evidenceRefs);
  });

  it("hashes aggregation deterministically", () => {
    const first = aggregateUnifiedAdvisory(allSources({
      operationalRules: { evidenceRefs: ["b", "a"] },
    }));
    const second = aggregateUnifiedAdvisory(allSources({
      operationalRules: { evidenceRefs: ["a", "b"] },
    }));

    expect(first.advisoryHash).toBe(second.advisoryHash);
  });

  it("keeps aggregation advisory-only and does not mutate inputs", () => {
    const input = allSources();
    const before = JSON.stringify(input);
    const result = aggregateUnifiedAdvisory(input);

    expect(JSON.stringify(input)).toBe(before);
    expect(result.authority).toBe("ADVISORY_ONLY");
    expect(result.mayDeploy).toBe(false);
    expect(result.mayBlockDeployment).toBe(false);
    expect(result.mayRetry).toBe(false);
    expect(result.mayCancel).toBe(false);
    expect(result.mayRollback).toBe(false);
    expect(result.mayResume).toBe(false);
    expect(result.requiresExplicitEnforcementPhase).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
  });
});
