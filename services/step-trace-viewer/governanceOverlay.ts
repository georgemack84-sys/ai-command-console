import type { GovernanceOverlay, TraceViewerError, TraceViewerWarning } from "@/types/step-trace-viewer";
import type { ExecutionTreatyPackage } from "@/types/execution-treaty";
import type { ValidationPipelineOutput } from "@/services/validation-core";
import { hashTraceViewerValue } from "./traceViewHasher";

export function projectGovernanceOverlay(input: {
  treaty: ExecutionTreatyPackage;
  validation: ValidationPipelineOutput;
}): { overlay?: GovernanceOverlay; warnings: readonly TraceViewerWarning[]; errors: readonly TraceViewerError[] } {
  const governance = input.validation.result.validators.governance;
  const warnings: TraceViewerWarning[] = [];
  const errors: TraceViewerError[] = [];

  if (!input.treaty.manifest.governanceSnapshotHash || !input.treaty.manifest.approvalChainHash) {
    errors.push({
      code: "TRACE_GOVERNANCE_VIEW_INCOMPLETE",
      message: "governance lineage is incomplete",
      path: "manifest.governanceSnapshotHash",
    });
    return { warnings: Object.freeze(warnings), errors: Object.freeze(errors) };
  }

  if (!governance.passed) {
    warnings.push({
      code: "trace-governance-warning",
      message: "governance denial remains visible",
      path: "validators.governance",
    });
  }

  const overlay: GovernanceOverlay = Object.freeze({
    policyId: input.treaty.manifest.approvalChainHash,
    decision:
      governance.status === "passed"
      || governance.status === "failed"
      || governance.status === "denied"
      || governance.status === "revalidation-required"
        ? governance.status
        : "failed",
    evaluator: "validation-core",
    reason: governance.failureCode ?? "governance-passed",
    evidenceHash: hashTraceViewerValue("trace-governance-overlay", {
      governanceSnapshotHash: input.treaty.manifest.governanceSnapshotHash,
      approvalChainHash: input.treaty.manifest.approvalChainHash,
      validatorHash: governance.hash,
    }),
    escalationState: governance.passed ? "none" : governance.status === "revalidation-required" ? "revalidation-required" : "denied",
  });

  return { overlay, warnings: Object.freeze(warnings), errors: Object.freeze(errors) };
}
