export function createStaticRollbackCapabilityRegistry() {
  return ["full", "partial", "none", "unknown"] as const;
}

export function validateRollbackCapability(value: unknown): value is "full" | "partial" | "none" | "unknown" {
  return createStaticRollbackCapabilityRegistry().includes(value as never);
}
