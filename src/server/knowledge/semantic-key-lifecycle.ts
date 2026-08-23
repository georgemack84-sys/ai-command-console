export type SemanticKeyLifecycleOperation = "DEPRECATE" | "RETIRE";
export type SemanticKeyRegistryStatus = "ACTIVE" | "DEPRECATED" | "RETIRED";

export function canProposeSemanticKeyLifecycle(currentStatus: string | null | undefined, operation: SemanticKeyLifecycleOperation) {
  return operation === "DEPRECATE" ? currentStatus === "ACTIVE" : currentStatus === "DEPRECATED";
}

export function semanticKeyStatusForOperation(operation: "UPSERT" | SemanticKeyLifecycleOperation): SemanticKeyRegistryStatus {
  if (operation === "DEPRECATE") return "DEPRECATED";
  if (operation === "RETIRE") return "RETIRED";
  return "ACTIVE";
}
