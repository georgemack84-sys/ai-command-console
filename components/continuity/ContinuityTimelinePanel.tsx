"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function ContinuityTimelinePanel({
  auditHistory,
}: {
  auditHistory: Array<Record<string, unknown>>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Continuity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {auditHistory.length ? (
          <ol className="space-y-3">
            {auditHistory.map((event, index) => (
              <li key={String(event.id || index)} className="border-l border-white/10 pl-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{String(event.type || "unknown")}</p>
                <p className="mt-1 text-sm text-white">{String(event.message || "No message")}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-slate-400">No continuity timeline available.</p>
        )}
      </CardContent>
    </Card>
  );
}
