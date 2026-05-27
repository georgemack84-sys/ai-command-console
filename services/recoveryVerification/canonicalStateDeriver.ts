export function deriveCanonicalState({
  readModel,
  timeline,
  continuityState,
}: {
  readModel: any;
  timeline: any;
  continuityState?: any;
}) {
  return {
    executionStatus: String(readModel?.execution?.status || "unknown"),
    verificationStatus: String(readModel?.verification?.status || "unknown"),
    timelineMatchesReadModel: timeline?.meta?.matchesReadModel === true,
    continuityRuntimeState: String(continuityState?.runtimeState || "UNKNOWN"),
  };
}
