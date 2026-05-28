import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildPolicyDecisionExplanation,
  projectApprovalReasoning,
  projectConstraintReasoning,
  projectEnforcementReasoning,
  projectGovernanceReasoning,
  projectPolicyActivations,
  projectPolicyReplayReasoning,
  projectRiskReasoning,
} from "@/services/policy-decision-explainer";
import { buildStepTraceFixture } from "@/tests/step-trace-viewer/helpers";

export function buildPolicyDecisionFixture(overrides: Partial<{
  strict: boolean;
  decisionId: string;
  executionId: string;
}> = {}) {
  const traceFixture = buildStepTraceFixture({
    includeEvidence: true,
    includeForensics: true,
    includeGovernance: true,
    includeReplay: true,
    executionId: overrides.executionId,
  });

  const request = {
    decisionId: overrides.decisionId ?? "decision-001",
    executionId: overrides.executionId ?? traceFixture.view.executionId,
    traceView: traceFixture.view,
    validationOutput: traceFixture.validationFixture.output,
    treatyEvidence: traceFixture.validationFixture.context.treaty,
    options: overrides.strict === undefined ? undefined : { strict: overrides.strict },
  };

  return {
    traceFixture,
    request,
    explanation: buildPolicyDecisionExplanation(request),
  };
}

export function loadPolicyDecisionExplainerSources() {
  const root = path.resolve("services", "policy-decision-explainer");
  return [
    "index.ts",
    "decisionExplanationEngine.ts",
    "policyActivationProjection.ts",
    "governanceReasoningProjection.ts",
    "riskReasoningProjection.ts",
    "approvalReasoningProjection.ts",
    "constraintReasoningProjection.ts",
    "enforcementReasoningProjection.ts",
    "policyReplayProjection.ts",
    "decisionExplanationAssembler.ts",
    "decisionExplanationHasher.ts",
    "decisionExplainerGuards.ts",
  ].map((file) => ({
    path: path.join(root, file),
    content: readFileSync(path.join(root, file), "utf8"),
  }));
}

export {
  projectApprovalReasoning,
  projectConstraintReasoning,
  projectEnforcementReasoning,
  projectGovernanceReasoning,
  projectPolicyActivations,
  projectPolicyReplayReasoning,
  projectRiskReasoning,
};
