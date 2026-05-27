import type { CanonicalIntent } from "@/types/semanticResolution";
import type { ToolRegistryEntry } from "@/services/registry/toolRegistry";

export function resolveApprovalPolicy(input: {
  canonicalIntent: CanonicalIntent;
  registryEntry: ToolRegistryEntry | null;
}) {
  const approvalRequired =
    Boolean(input.registryEntry?.requiresApprovalDefault)
    || input.canonicalIntent.governanceRisk === "review"
    || input.canonicalIntent.governanceRisk === "restricted";

  return {
    approvalRequired,
    reasons: approvalRequired ? ["APPROVAL_REQUIRED"] : [],
  };
}
