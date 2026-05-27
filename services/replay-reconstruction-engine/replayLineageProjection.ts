import type { PolicyDecisionExplanation } from "@/types/policy-decision-explainer";
import type { StepTraceView } from "@/types/step-trace-viewer";
import type { ExecutionTreatyPackage } from "@/types/execution-treaty";
import type { ValidationPipelineOutput } from "@/services/validation-core";
import type { ReplayLineageView } from "@/types/replay-reconstruction-engine";
import { resolveReplaySnapshotBindings } from "./replaySnapshotResolver";
import { bindReplayRuntime } from "./replayRuntimeBinder";

function collectToolContracts(comparisonArtifact: unknown): readonly string[] {
  if (!comparisonArtifact || typeof comparisonArtifact !== "object") {
    return Object.freeze([]);
  }
  const record = comparisonArtifact as Record<string, unknown>;
  const steps = Array.isArray(record.steps) ? record.steps : [];
  const contracts = steps
    .flatMap((step) => {
      if (!step || typeof step !== "object") {
        return [];
      }
      const toolBinding = (step as Record<string, unknown>).toolBinding;
      return typeof toolBinding === "string" ? [toolBinding] : [];
    })
    .sort((left, right) => left.localeCompare(right));
  return Object.freeze(contracts);
}

function collectDependencyOrder(traceView?: StepTraceView, comparisonArtifact?: unknown): readonly string[] {
  const traceEdges = traceView?.dependencyGraph.edges.map((edge) => edge.edgeId) ?? [];
  if (traceEdges.length > 0) {
    return Object.freeze([...traceEdges]);
  }
  if (comparisonArtifact && typeof comparisonArtifact === "object") {
    const steps = Array.isArray((comparisonArtifact as Record<string, unknown>).steps)
      ? ((comparisonArtifact as Record<string, unknown>).steps as unknown[])
      : [];
    const ids = steps.flatMap((step) => {
      if (!step || typeof step !== "object") {
        return [];
      }
      const stepId = (step as Record<string, unknown>).stepId;
      return typeof stepId === "string" ? [stepId] : [];
    });
    return Object.freeze(ids);
  }
  return Object.freeze([]);
}

export function projectReplayLineage(input: {
  treaty: ExecutionTreatyPackage;
  validation: ValidationPipelineOutput;
  traceView?: StepTraceView;
  policyExplanation?: PolicyDecisionExplanation;
  comparisonArtifact?: unknown;
}): ReplayLineageView {
  const resolved = resolveReplaySnapshotBindings(input.treaty);
  const runtime = bindReplayRuntime(input.validation);
  const toolContracts = collectToolContracts(input.comparisonArtifact);
  const dependencyOrder = collectDependencyOrder(input.traceView, input.comparisonArtifact);

  return Object.freeze({
    treatyId: input.treaty.manifest.treatyId,
    replaySnapshotHash: resolved.replaySnapshotHash ?? "missing-replay-snapshot",
    replayBindingHash: resolved.replayBindingHash ?? "missing-replay-binding",
    registrySnapshotHash: resolved.registrySnapshotHash ?? "missing-registry-snapshot",
    governanceSnapshotHash: resolved.governanceSnapshotHash ?? "missing-governance-snapshot",
    approvalChainHash: resolved.approvalChainHash ?? "missing-approval-chain",
    provenanceHash: resolved.provenanceHash ?? "missing-provenance-hash",
    treatyEvidenceHash: resolved.treatyEvidenceHash ?? "missing-treaty-evidence-hash",
    validatorBindings: runtime.validatorBindings,
    toolContracts,
    dependencyOrder,
    valid: resolved.valid
      && runtime.runtimeCompatible
      && Boolean(input.policyExplanation?.replayExplanation)
      && dependencyOrder.length > 0,
  });
}
