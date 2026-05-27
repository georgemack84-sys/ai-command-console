import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildPlanDiffInspection,
  projectArtifactDiff,
  projectDependencyDrift,
  projectEvidenceDrift,
  projectGovernanceDrift,
  projectHashIntegrity,
  projectReplayDrift,
} from "@/services/plan-diff-inspector";
import { buildPolicyDecisionFixture } from "@/tests/policy-decision-explainer/helpers";

type FixtureArtifact = Readonly<Record<string, unknown>>;

export function buildPlanDiffArtifacts(): {
  baseArtifact: FixtureArtifact;
  targetArtifact: FixtureArtifact;
} {
  const policyFixture = buildPolicyDecisionFixture();
  const treaty = policyFixture.traceFixture.validationFixture.context.treaty;
  const explanation = policyFixture.explanation;
  const traceView = policyFixture.traceFixture.view;

  const baseArtifact = Object.freeze({
    planId: treaty.manifest.planId,
    planHash: treaty.manifest.planHash,
    riskTier: "medium",
    trustZone: treaty.manifest.trustZone,
    approvalRequirements: Object.freeze([...explanation.approvalExplanation.approvalsRequired]),
    rollbackContract: Object.freeze({
      survivabilityHash: treaty.manifest.survivabilityHash,
      revalidationRequired: treaty.manifest.preExecutionRevocationStatus !== "still_admissible",
    }),
    policySnapshotHash: treaty.manifest.governanceSnapshotHash,
    capabilityClassification: Object.freeze(["read-only", ...explanation.constraintExplanation.deniedCapabilities]),
    sideEffectClassification: Object.freeze(["none"]),
    isolationRequirements: Object.freeze(["sandboxed"]),
    replaySnapshotHash: treaty.manifest.replaySnapshotHash,
    replayBindingHash: treaty.manifest.replayBindingHash,
    replayHash: explanation.replayExplanation.replayHash ?? treaty.evidence.replayLineageHash,
    registrySnapshotHash: treaty.manifest.registrySnapshotHash,
    executionTruthHash: treaty.manifest.executionTruthHash,
    provenanceHash: treaty.manifest.provenanceHash,
    evidenceRefs: Object.freeze([...explanation.evidenceRefs]),
    dependencies: Object.freeze([
      Object.freeze({ from: "step-1", to: "step-2" }),
    ]),
    steps: Object.freeze([
      Object.freeze({
        stepId: "step-1",
        toolBinding: "tool:alpha",
        inputHash: "sha256:input-1",
        dependencies: Object.freeze([]),
      }),
      Object.freeze({
        stepId: "step-2",
        toolBinding: "tool:beta",
        inputHash: "sha256:input-2",
        dependencies: Object.freeze(["step-1"]),
      }),
    ]),
    policyExplanation: explanation,
    traceViewSummary: Object.freeze({
      validationStatus: traceView.validationView.status,
      dependencyGraph: traceView.dependencyGraph,
      governanceOverlay: traceView.governanceOverlay,
      replayView: traceView.replayView,
      evidenceView: traceView.evidenceView,
    }),
    evidenceBundle: Object.freeze({
      registryLineageHash: treaty.evidence.registryLineageHash,
      governanceLineageHash: treaty.evidence.governanceLineageHash,
      replayLineageHash: treaty.evidence.replayLineageHash,
      policyExplanationHash: explanation.explanationHash,
    }),
  });

  const targetArtifact = Object.freeze({
    ...baseArtifact,
    riskTier: "high",
    trustZone: "quarantined",
    approvalRequirements: Object.freeze(["governance-approval-extra"]),
    replayHash: "sha256:changed-replay-hash",
    evidenceRefs: Object.freeze([...explanation.evidenceRefs, "unknown-evidence-ref"]),
    dependencies: Object.freeze([
      Object.freeze({ from: "step-2", to: "step-1" }),
      Object.freeze({ from: "step-1", to: "step-2" }),
    ]),
    steps: Object.freeze([
      Object.freeze({
        stepId: "step-2",
        toolBinding: "tool:beta",
        inputHash: "sha256:input-2-changed",
        dependencies: Object.freeze(["step-1"]),
      }),
      Object.freeze({
        stepId: "step-1",
        toolBinding: "tool:alpha",
        inputHash: "sha256:input-1",
        dependencies: Object.freeze([]),
      }),
    ]),
    traceViewSummary: Object.freeze({
      ...baseArtifact.traceViewSummary,
      replayView: traceView.replayView
        ? Object.freeze({
            ...traceView.replayView,
            replayDivergence: true,
          })
        : traceView.replayView,
    }),
    evidenceBundle: Object.freeze({
      ...baseArtifact.evidenceBundle,
      replayLineageHash: "sha256:changed-lineage-hash",
    }),
  });

  return { baseArtifact, targetArtifact };
}

export function buildPlanDiffFixture(overrides: Partial<{
  comparisonMode: "PLAN_TO_PLAN" | "PLAN_TO_REPLAY" | "PLAN_TO_HANDOFF" | "POLICY_BINDING" | "REGISTRY_BINDING" | "EVIDENCE_BUNDLE";
  sourceRefs: readonly string[];
  baseArtifact: unknown;
  targetArtifact: unknown;
}> = {}) {
  const artifacts = buildPlanDiffArtifacts();
  const input = {
    comparisonMode: overrides.comparisonMode ?? "PLAN_TO_PLAN",
    sourceRefs: overrides.sourceRefs ?? ["policy-explanation", "trace-view", "execution-treaty"],
    baseArtifact: overrides.baseArtifact ?? artifacts.baseArtifact,
    targetArtifact: overrides.targetArtifact ?? artifacts.targetArtifact,
  } as const;

  return {
    ...artifacts,
    input,
    inspection: buildPlanDiffInspection(input),
  };
}

export function loadPlanDiffInspectorSources() {
  const root = path.resolve("services", "plan-diff-inspector");
  return [
    "index.ts",
    "planDiffInspector.ts",
    "artifactDiffProjection.ts",
    "hashIntegrityProjection.ts",
    "governanceDriftProjection.ts",
    "replayDriftProjection.ts",
    "dependencyDriftProjection.ts",
    "evidenceDriftProjection.ts",
    "inspectionAssembler.ts",
    "inspectionHasher.ts",
    "inspectionGuards.ts",
  ].map((file) => ({
    path: path.join(root, file),
    content: readFileSync(path.join(root, file), "utf8"),
  }));
}

export {
  projectArtifactDiff,
  projectDependencyDrift,
  projectEvidenceDrift,
  projectGovernanceDrift,
  projectHashIntegrity,
  projectReplayDrift,
};
