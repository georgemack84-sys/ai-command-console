"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function ReplayIntegrityPanel({
  replayVerificationState,
  replayDivergenceCount,
  checkpointIntegrity,
  lineageIntegrity,
}: {
  replayVerificationState: string;
  replayDivergenceCount: number;
  checkpointIntegrity: boolean;
  lineageIntegrity: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Replay Integrity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-white">{replayVerificationState}</p>
        <p className="text-sm text-slate-300">Replay divergence count: {replayDivergenceCount}</p>
        <p className="text-sm text-slate-300">Checkpoint integrity: {checkpointIntegrity ? "valid" : "invalid"}</p>
        <p className="text-sm text-slate-300">Lineage integrity: {lineageIntegrity ? "valid" : "invalid"}</p>
      </CardContent>
    </Card>
  );
}
