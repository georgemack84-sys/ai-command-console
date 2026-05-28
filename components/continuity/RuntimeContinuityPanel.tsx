"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function RuntimeContinuityPanel({
  runtimeState,
  continuityConfidence,
  operationalStability,
  degradedSystems,
  staleLockSummary,
}: {
  runtimeState: string;
  continuityConfidence: number;
  operationalStability: string;
  degradedSystems: string[];
  staleLockSummary: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Runtime Continuity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-white">{runtimeState}</p>
        <p className="text-sm text-slate-300">Confidence: {Math.round(continuityConfidence * 100)}%</p>
        <p className="text-sm text-slate-300">Operational stability: {operationalStability}</p>
        <p className="text-sm text-slate-300">{staleLockSummary}</p>
        {degradedSystems.length ? (
          <ul className="space-y-1 text-sm text-slate-300">
            {degradedSystems.map((system) => <li key={system}>{system}</li>)}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">No degraded systems reported.</p>
        )}
      </CardContent>
    </Card>
  );
}
