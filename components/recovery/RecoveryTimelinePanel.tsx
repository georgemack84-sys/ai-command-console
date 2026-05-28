import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { RecoveryTimeline } from "@/types/recoveryTimeline";

export function RecoveryTimelinePanel({ timeline }: { timeline: RecoveryTimeline }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {timeline.events.length === 0 ? (
          <p className="text-sm text-slate-400">No timeline events available.</p>
        ) : (
          <ol className="space-y-3">
            {timeline.events.map((event) => (
              <li key={event.eventId} className="border-l border-white/10 pl-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{event.source}</p>
                <p className="mt-1 text-sm font-medium text-white">{event.summary}</p>
                <p className="mt-1 text-xs text-slate-400">{event.type}</p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

