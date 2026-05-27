import type { PolicyDecisionExplanation } from "@/types/policy-decision-explainer";
import type { StepTraceView } from "@/types/step-trace-viewer";
import type { ValidationPipelineOutput } from "@/services/validation-core";
import type { ReplayComparisonView, ReplayLineageView, ReplayVisualization } from "@/types/replay-reconstruction-engine";
import { hashReplayValue } from "./replayHasher";

export function assembleReplayVisualization(input: {
  validation: ValidationPipelineOutput;
  traceView?: StepTraceView;
  policyExplanation?: PolicyDecisionExplanation;
  lineage: ReplayLineageView;
  comparison: ReplayComparisonView;
}): ReplayVisualization {
  const eventIds = input.validation.events.map((event) => event.eventId);
  const dependencyEdges = input.traceView?.dependencyGraph.edges.map((edge) => edge.edgeId) ?? input.lineage.dependencyOrder;
  const causalityChain = input.traceView?.forensicView?.causalityChain ?? [];
  const visibleEvidenceRefs = [
    ...input.validation.forensics.evidence,
    ...(input.policyExplanation?.evidenceRefs ?? []),
  ].sort((left, right) => left.localeCompare(right));

  return Object.freeze({
    replayTimelineId: input.validation.timeline.timelineId,
    eventIds: Object.freeze(eventIds),
    dependencyEdges: Object.freeze([...dependencyEdges]),
    causalityChain: Object.freeze([...causalityChain]),
    policyReplayWarnings: Object.freeze([
      ...(input.policyExplanation?.replayExplanation.governanceReplayWarnings ?? []),
      ...input.comparison.warnings,
    ].sort((left, right) => left.localeCompare(right))),
    visibleEvidenceRefs: Object.freeze(visibleEvidenceRefs),
    visualizationHash: hashReplayValue("replay-visualization", {
      replayTimelineId: input.validation.timeline.timelineId,
      eventIds,
      dependencyEdges,
      causalityChain,
      visibleEvidenceRefs,
    }),
  });
}
