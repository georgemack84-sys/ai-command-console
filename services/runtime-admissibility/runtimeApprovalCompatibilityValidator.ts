import type {
  RuntimeAdmissibilityError,
  RuntimeAdmissibilityInput,
} from "./runtimeAdmissibilityStateTypes";
import { normalizeRuntimeAdmissibilityMetadata } from "./runtimeAdmissibilitySchemas";

export function validateRuntimeApprovalCompatibility(
  input: RuntimeAdmissibilityInput,
): readonly RuntimeAdmissibilityError[] {
  const metadata = normalizeRuntimeAdmissibilityMetadata(input.metadata);
  if (input.constitutionalReplayResult.replayState.approvalState === "stable"
    && !metadata.includes("approvalambiguity")
    && !metadata.includes("inferredapproval")) {
    return Object.freeze([]);
  }
  return Object.freeze([Object.freeze({
    code: "RUNTIME_ADMISSIBILITY_APPROVAL_AMBIGUOUS",
    message: "Runtime admissibility rejects approval ambiguity or inferred approval lineage.",
    path: "constitutionalReplayResult.replayState.approvalState",
  })]);
}
