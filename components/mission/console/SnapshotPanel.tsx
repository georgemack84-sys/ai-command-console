import type { MissionConsoleView } from "@/types/mission-intelligence-console";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

type SnapshotPanelProps = Readonly<{
  snapshots: MissionConsoleView["snapshots"]["data"]["snapshots"];
}>;

export function SnapshotPanel({ snapshots }: SnapshotPanelProps) {
  return (
    <Card id="snapshots">
      <CardHeader><CardTitle>Snapshots</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        {snapshots.map((snapshot) => (
          <div key={snapshot.snapshotId} className="rounded-md border border-white/10 p-3">
            <p className="text-white">{snapshot.snapshotType}</p>
            <p>Lineage: {snapshot.lineageId}</p>
            <p>Parent: {snapshot.parentSnapshotId ?? "none"}</p>
            <p>Autonomy: {snapshot.autonomyLevel}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
