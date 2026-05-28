import type { ExecutionTreatyPackage } from "@/types/execution-treaty";
import type { StepTraceView } from "@/types/step-trace-viewer";
import type { ValidationPipelineOutput } from "@/services/validation-core";
import type { ApprovalExplanationView } from "./approvalExplanationView";
import type { ConstraintExplanationView } from "./constraintExplanationView";
import type { EnforcementExplanationView } from "./enforcementExplanationView";
import type { GovernanceReasoningView } from "./governanceReasoningView";
import type { PolicyDecisionExplainerError } from "./errors";
import type { PolicyActivationView } from "./policyActivationView";
import type { PolicyReplayView } from "./policyReplayView";
import type { RiskExplanationView } from "./riskExplanationView";

export type PolicyDecisionExplanationRequest = Readonly<{
  decisionId: string;
  executionId: string;
  traceView?: StepTraceView;
  validationOutput?: ValidationPipelineOutput;
  treatyEvidence?: ExecutionTreatyPackage | unknown;
  options?: Readonly<{
    strict?: boolean;
  }>;
}>;

export type PolicyDecisionExplanation = Readonly<{
  decisionId: string;
  executionId: string;
  finalDecision: "approved" | "denied" | "escalated" | "paused" | "requires_review" | "unknown";
  policyActivations: readonly PolicyActivationView[];
  governanceReasoning: GovernanceReasoningView;
  riskExplanation: RiskExplanationView;
  approvalExplanation: ApprovalExplanationView;
  constraintExplanation: ConstraintExplanationView;
  enforcementExplanation: EnforcementExplanationView;
  replayExplanation: PolicyReplayView;
  evidenceRefs: readonly string[];
  warnings: readonly string[];
  errors: readonly PolicyDecisionExplainerError[];
  explanationHash: string;
}>;
