import type { BoundedOrchestrationInput, OrchestrationDelegationAnalysis } from "@/types/bounded-orchestration-framework";

export function detectRecursiveDelegation(input: BoundedOrchestrationInput): OrchestrationDelegationAnalysis {
  const evidence = new Set<string>();
  const priorLineageIds = input.routingResult.lineage.entries.map((entry) => entry.lineageRecordId);
  const depth = priorLineageIds.length + 1;
  const delegationCount = priorLineageIds.length;
  if (new Set(priorLineageIds).size !== priorLineageIds.length) {
    evidence.add("duplicate-routing-lineage");
  }
  if (input.routingResult.lineage.entries.some((entry) => entry.target === input.routingResult.target)) {
    evidence.add("repeated-route-target");
  }
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  if (
    serialized.includes("recursive") ||
    serialized.includes("delegationloop") ||
    serialized.includes("orchestrationchild")
  ) {
    evidence.add("metadata-recursion-marker");
  }
  if (depth > 5) {
    evidence.add("depth-exceeded");
  }
  if (delegationCount > 3) {
    evidence.add("delegation-count-exceeded");
  }
  return Object.freeze({
    recursive: evidence.size > 0,
    depth,
    delegationCount,
    evidence: Object.freeze([...evidence].sort()),
  });
}
