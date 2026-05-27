import type { StepTraceViewRequest } from "@/types/step-trace-viewer";
import type { ValidationPipelineOutput } from "@/services/validation-core";
import type { StepTraceView, TraceViewerError } from "@/types/step-trace-viewer";
import { hashTraceViewerValue } from "./traceViewHasher";
import { assembleStepTraceView } from "./traceViewAssembler";

export type TraceProjectionSource = Readonly<{
  request: StepTraceViewRequest;
  validation: ValidationPipelineOutput;
  sourceTruthHash: string;
  viewId: string;
  executionId: string;
}>;

export function createTraceProjectionSource(
  request: StepTraceViewRequest,
): TraceProjectionSource {
  if (!request.treaty || !request.validation) {
    throw new Error("TRACE_SOURCE_TRUTH_MISSING");
  }

  const sourceTruthHash = hashTraceViewerValue("trace-source-truth", {
    treatyHash: request.treaty.hashes.treatyHash,
    validationResultHash: request.validation.result.resultHash,
    timelineHash: request.validation.timeline.timelineHash,
    forensicHash: request.validation.forensics.explanationHash,
    eventChainHash: request.validation.eventIntegrity.at(-1)?.chainHash,
  });

  const executionId = request.executionId ?? request.treaty.manifest.planId;
  const viewId = request.traceId ?? hashTraceViewerValue("step-trace-view-id", {
    executionId,
    validationId: request.validation.result.validationId,
    treatyId: request.treaty.manifest.treatyId,
  });

  return Object.freeze({
    request,
    validation: request.validation,
    sourceTruthHash,
    viewId,
    executionId,
  });
}

function buildFailClosedView(request: Partial<StepTraceViewRequest>, error: TraceViewerError): StepTraceView {
  const sourceTruthHash = hashTraceViewerValue("trace-source-truth-missing", {
    traceId: request.traceId,
    executionId: request.executionId,
    code: error.code,
  });
  const viewId = request.traceId ?? hashTraceViewerValue("step-trace-view-id-fail-closed", {
    executionId: request.executionId ?? "unknown-execution",
    code: error.code,
  });

  return Object.freeze({
    viewId,
    executionId: request.executionId ?? "unknown-execution",
    planHash: request.treaty?.manifest.planHash ?? "unknown-plan-hash",
    traceProjectionHash: hashTraceViewerValue("step-trace-view-fail-closed", {
      viewId,
      sourceTruthHash,
      error,
    }),
    sourceTruthHash,
    generatedAt: request.validation?.result.generatedAt ?? "1970-01-01T00:00:00.000Z",
    timeline: Object.freeze({
      timelineId: "unavailable",
      rootEventId: "unavailable",
      events: Object.freeze([]),
      deterministic: true,
      visibleEventCount: 0,
      timelineHash: hashTraceViewerValue("trace-timeline-empty", error),
    }),
    dependencyGraph: Object.freeze({
      nodes: Object.freeze([]),
      edges: Object.freeze([]),
      hasCycle: false,
      hasDuplicateEdges: false,
      visibleNodeCount: 0,
      visibleEdgeCount: 0,
      projectionHash: hashTraceViewerValue("trace-dependency-empty", error),
    }),
    stateView: Object.freeze({
      reconstructedStateHash: "unavailable",
      currentStatus: "invalid",
      transitions: Object.freeze([]),
      projectionHash: hashTraceViewerValue("trace-state-empty", error),
    }),
    validationView: Object.freeze({
      status: "invalid",
      deterministic: true,
      items: Object.freeze([]),
      projectionHash: hashTraceViewerValue("trace-validation-empty", error),
    }),
    warnings: Object.freeze([]),
    errors: Object.freeze([error]),
    visibleEventCount: 0,
    visibleNodeCount: 0,
    visibleEdgeCount: 0,
    missingEvidenceCount: 0,
    warningCount: 0,
    errorCount: 1,
  });
}

export function buildStepTraceView(
  request: StepTraceViewRequest,
): StepTraceView {
  if (!request?.treaty || !request?.validation) {
    return buildFailClosedView(request, {
      code: "TRACE_SOURCE_TRUTH_MISSING",
      message: "step trace view requires treaty and validation source truth",
      path: "request",
    });
  }

  try {
    const source = createTraceProjectionSource(request);
    const assembled = assembleStepTraceView(source);
    const expectedProjectionHash = hashTraceViewerValue("step-trace-view", {
      viewId: assembled.viewId,
      sourceTruthHash: assembled.sourceTruthHash,
      timeline: assembled.timeline,
      dependencyGraph: assembled.dependencyGraph,
      stateView: assembled.stateView,
      governanceOverlay: assembled.governanceOverlay,
      validationView: assembled.validationView,
      replayView: assembled.replayView,
      forensicView: assembled.forensicView,
      evidenceView: assembled.evidenceView,
    });

    if (expectedProjectionHash !== assembled.traceProjectionHash) {
      const hashError: TraceViewerError = {
        code: "TRACE_VIEW_HASH_MISMATCH",
        message: "trace projection hash mismatch detected",
        path: "traceProjectionHash",
        expected: expectedProjectionHash,
        actual: assembled.traceProjectionHash,
      };
      return Object.freeze({
        ...assembled,
        errors: Object.freeze([
          ...assembled.errors,
          hashError,
        ]),
        errorCount: assembled.errors.length + 1,
      });
    }

    return assembled;
  } catch (error) {
    return buildFailClosedView(request, {
      code: "TRACE_UNSUPPORTED_SOURCE_ARTIFACT",
      message: error instanceof Error ? error.message : "unsupported source artifact",
      path: "request",
    });
  }
}
