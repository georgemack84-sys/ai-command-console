import type { ExecutionTreatyPackage } from "@/types/execution-treaty";
import type { ValidationPipelineOutput } from "@/services/validation-core";
import type { TraceViewerError, TraceViewerWarning } from "./errors";
import type { DependencyProjection } from "./dependencyView";
import type { EvidenceNavigatorView } from "./evidenceView";
import type { ForensicProjection } from "./forensicView";
import type { GovernanceOverlay } from "./governanceView";
import type { StateProjection } from "./projection";
import type { ReplayProjection } from "./replayView";
import type { TimelineProjection } from "./timelineView";
import type { ValidationProjection } from "./validationView";

export type StepTraceViewRequest = Readonly<{
  validationResultId?: string;
  executionId?: string;
  traceId?: string;
  includeGovernance?: boolean;
  includeReplay?: boolean;
  includeForensics?: boolean;
  includeEvidence?: boolean;
  treaty: ExecutionTreatyPackage;
  validation: ValidationPipelineOutput;
}>;

export type StepTraceView = Readonly<{
  viewId: string;
  executionId: string;
  planHash: string;
  traceProjectionHash: string;
  sourceTruthHash: string;
  generatedAt: string;
  timeline: TimelineProjection;
  dependencyGraph: DependencyProjection;
  stateView: StateProjection;
  governanceOverlay?: GovernanceOverlay;
  validationView: ValidationProjection;
  replayView?: ReplayProjection;
  forensicView?: ForensicProjection;
  evidenceView?: EvidenceNavigatorView;
  warnings: readonly TraceViewerWarning[];
  errors: readonly TraceViewerError[];
  projectionBuildDurationMs?: number;
  visibleEventCount: number;
  visibleNodeCount: number;
  visibleEdgeCount: number;
  missingEvidenceCount: number;
  warningCount: number;
  errorCount: number;
}>;
