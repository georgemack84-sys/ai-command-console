import { resolveValidationCausality } from "@/services/validation-core";
import type { StepTraceView, TraceViewerError, TraceViewerWarning } from "@/types/step-trace-viewer";
import { projectDependencyGraph } from "./dependencyProjection";
import { projectEvidenceNavigator } from "./evidenceNavigator";
import { projectForensics } from "./forensicProjection";
import { projectGovernanceOverlay } from "./governanceOverlay";
import { projectReplayView } from "./replayProjection";
import { projectStateView } from "./stateProjection";
import { projectTimeline } from "./timelineProjection";
import { projectValidationView } from "./validationProjection";
import { hashTraceViewerValue } from "./traceViewHasher";
import type { TraceProjectionSource } from "./traceProjectionEngine";

export function assembleStepTraceView(
  source: TraceProjectionSource,
): StepTraceView {
  const errors: TraceViewerError[] = [];
  const warnings: TraceViewerWarning[] = [];

  const timeline = projectTimeline(source.validation);
  const dependency = projectDependencyGraph(source.validation);
  warnings.push(...dependency.warnings);

  const validationView = projectValidationView(source.validation);
  const causality = resolveValidationCausality(source.validation.events);
  if (!causality.valid) {
    errors.push({
      code: "TRACE_CAUSALITY_UNAVAILABLE",
      message: "causality graph is unavailable",
      path: "events",
    });
  }

  const stateView = projectStateView(source.validation);

  const governanceOverlay = source.request.includeGovernance === false
    ? undefined
    : (() => {
        const projected = projectGovernanceOverlay({
          treaty: source.request.treaty,
          validation: source.validation,
        });
        warnings.push(...projected.warnings);
        errors.push(...projected.errors);
        return projected.overlay;
      })();

  const replayView = source.request.includeReplay === false
    ? undefined
    : (() => {
        const projected = projectReplayView({
          treaty: source.request.treaty,
          validation: source.validation,
        });
        warnings.push(...projected.warnings);
        errors.push(...projected.errors);
        return projected.projection;
      })();

  const forensicView = source.request.includeForensics === false
    ? undefined
    : (() => {
        const projected = projectForensics(source.validation);
        errors.push(...projected.errors);
        return projected.projection;
      })();

  const evidenceView = source.request.includeEvidence === false
    ? undefined
    : (() => {
        const projected = projectEvidenceNavigator({
          treaty: source.request.treaty,
          validation: source.validation,
        });
        warnings.push(...projected.warnings);
        return projected.projection;
      })();

  if (!timeline.events.length) {
    errors.push({
      code: "TRACE_TIMELINE_UNAVAILABLE",
      message: "timeline projection is unavailable",
      path: "timeline.events",
    });
  }
  if (validationView.items.length !== 9) {
    errors.push({
      code: "TRACE_VALIDATION_VIEW_INCOMPLETE",
      message: "validation projection is incomplete",
      path: "validationView.items",
    });
  }
  if (dependency.projection.nodes.length === 0) {
    errors.push({
      code: "TRACE_DEPENDENCY_VIEW_INVALID",
      message: "dependency projection is invalid",
      path: "dependencyGraph.nodes",
    });
  }
  if (!source.validation.forensics) {
    errors.push({
      code: "TRACE_FORENSICS_UNAVAILABLE",
      message: "forensic source truth is unavailable",
      path: "validation.forensics",
    });
  }

  const traceProjectionHash = hashTraceViewerValue("step-trace-view", {
    viewId: source.viewId,
    sourceTruthHash: source.sourceTruthHash,
    timeline,
    dependencyGraph: dependency.projection,
    stateView,
    governanceOverlay,
    validationView,
    replayView,
    forensicView,
    evidenceView,
  });

  return Object.freeze({
    viewId: source.viewId,
    executionId: source.executionId,
    planHash: source.request.treaty.manifest.planHash,
    traceProjectionHash,
    sourceTruthHash: source.sourceTruthHash,
    generatedAt: source.validation.result.generatedAt,
    timeline,
    dependencyGraph: dependency.projection,
    stateView,
    governanceOverlay,
    validationView,
    replayView,
    forensicView,
    evidenceView,
    warnings: Object.freeze(warnings),
    errors: Object.freeze(errors),
    visibleEventCount: timeline.visibleEventCount,
    visibleNodeCount: dependency.projection.visibleNodeCount,
    visibleEdgeCount: dependency.projection.visibleEdgeCount,
    missingEvidenceCount: evidenceView?.missingEvidenceCount ?? 0,
    warningCount: warnings.length,
    errorCount: errors.length,
  });
}
