export function computeNextSnapshotAt({
  lastSnapshotAt,
  intervalMs = 1000 * 60 * 15,
}: {
  lastSnapshotAt?: string | null;
  intervalMs?: number;
}) {
  const base = lastSnapshotAt ? new Date(lastSnapshotAt).getTime() : Date.now();
  return new Date(base + intervalMs).toISOString();
}
