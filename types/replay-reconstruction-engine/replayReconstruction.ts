import type { PolicyDecisionExplanation } from "@/types/policy-decision-explainer";
import type { StepTraceView } from "@/types/step-trace-viewer";
import type { ExecutionTreatyPackage } from "@/types/execution-treaty";
import type { ValidationPipelineOutput } from "@/services/validation-core";
import type { ReplayComparisonView } from "./replayComparisonView";
import type { ReplayDriftView } from "./replayDriftView";
import type { ReplayIntegrityView } from "./replayIntegrityView";
import type { ReplayLineageView } from "./replayLineageView";
import type { ReplayVisualization } from "./replayVisualization";

export type ReplayReconstructionInput = Readonly<{
  treaty: ExecutionTreatyPackage;
  validation: ValidationPipelineOutput;
  traceView?: StepTraceView;
  policyExplanation?: PolicyDecisionExplanation;
  comparisonArtifact?: unknown;
  requestedAt?: string;
  environmentId?: string;
}>;

export type ReplayReconstructionResult = Readonly<{
  replayId: string;
  status: "RECONSTRUCTED" | "INVALID" | "DRIFT_DETECTED" | "UNINSPECTABLE";
  lineage: ReplayLineageView;
  integrity: ReplayIntegrityView;
  comparison: ReplayComparisonView;
  drift: ReplayDriftView;
  visualization: ReplayVisualization;
  reconstructionHash: string;
  warnings: readonly string[];
  errors: readonly string[];
}>;
