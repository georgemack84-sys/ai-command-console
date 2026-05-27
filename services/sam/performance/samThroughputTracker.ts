export type SamThroughputKind =
  | "bridge_completed"
  | "bridge_blocked"
  | "audit_appended"
  | "dryrun_generated"
  | "chaos_scenario_completed";

const throughput = new Map<SamThroughputKind, number>();

export function resetSamThroughputTracker() {
  throughput.clear();
}

export function recordSamThroughputEvent(kind: SamThroughputKind) {
  throughput.set(kind, (throughput.get(kind) || 0) + 1);
}

export function getSamThroughputSnapshot() {
  const byKind = Object.fromEntries(throughput.entries()) as Partial<Record<SamThroughputKind, number>>;
  const totalEvents = Object.values(byKind).reduce((sum, value) => sum + (value || 0), 0);
  return {
    totalEvents,
    byKind,
  };
}
