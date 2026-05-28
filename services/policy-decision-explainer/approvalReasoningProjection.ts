import type { ExecutionTreatyPackage } from "@/types/execution-treaty";
import type { StepTraceView } from "@/types/step-trace-viewer";
import type { ApprovalExplanationView, PolicyDecisionExplainerError } from "@/types/policy-decision-explainer";

export function projectApprovalReasoning(input: {
  traceView: StepTraceView;
  treaty?: ExecutionTreatyPackage;
}): { reasoning: ApprovalExplanationView; warnings: readonly string[]; errors: readonly PolicyDecisionExplainerError[] } {
  const warnings: string[] = [];
  const errors: PolicyDecisionExplainerError[] = [];
  const required = input.treaty?.manifest.approvalChainHash
    ? [input.treaty.manifest.approvalChainHash]
    : [];
  const received = input.traceView.governanceOverlay?.policyId
    ? [input.traceView.governanceOverlay.policyId]
    : [];
  const missing = required.filter((approval) => !received.includes(approval));
  const incomplete = required.length === 0 || missing.length > 0;

  if (required.length === 0) {
    errors.push({
      code: "POLICY_APPROVAL_REASONING_MISSING",
      message: "approval evidence is missing",
      path: "treaty.manifest.approvalChainHash",
    });
  }

  if (incomplete) {
    warnings.push("approval lineage remains incomplete");
  }

  return {
    reasoning: Object.freeze({
      approvalsRequired: Object.freeze(required),
      approvalsReceived: Object.freeze(received),
      approvalsMissing: Object.freeze(missing),
      approvalLineage: Object.freeze(
        [
          input.treaty?.manifest.governanceSnapshotHash,
          input.treaty?.manifest.approvalChainHash,
        ].filter((value): value is string => Boolean(value)),
      ),
      policyEvidenceRefs: Object.freeze(
        [input.traceView.governanceOverlay?.evidenceHash].filter((value): value is string => Boolean(value)),
      ),
      governanceEvidenceRefs: Object.freeze(
        [input.treaty?.evidence.governanceLineageHash].filter((value): value is string => Boolean(value)),
      ),
      incomplete,
    }),
    warnings: Object.freeze(warnings),
    errors: Object.freeze(errors),
  };
}
