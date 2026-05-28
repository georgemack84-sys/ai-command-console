import type { MissionConsoleView } from "@/types/mission-intelligence-console";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

type TimelinePanelProps = Readonly<{
  entries: MissionConsoleView["timeline"]["data"]["entries"];
}>;

export function TimelinePanel({ entries }: TimelinePanelProps) {
  return (
    <Card id="timeline">
      <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        {entries.map((entry) => (
          <div key={entry.eventId} className="rounded-md border border-white/10 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-white">{entry.eventType}</p>
              <p className={entry.state === "DISPUTED" ? "text-amber-200" : "text-emerald-200"}>{entry.state}</p>
            </div>
            <p>{entry.timestamp}</p>
            <p>Authority: {entry.authority}</p>
            <p>Sequence: {entry.sequence}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
