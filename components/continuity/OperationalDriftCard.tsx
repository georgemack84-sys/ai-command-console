"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { RecoveryDashboardReadModel } from "@/services/recovery/verification/recoveryVerificationTypes";

export function OperationalDriftCard({
  convergence,
}: {
  convergence: RecoveryDashboardReadModel["continuityConvergence"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Operational Drift</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        {!convergence ? (
          <p className="text-slate-400">Operational drift becomes visible once convergence analysis is available.</p>
        ) : (
          <>
            <p>Replay confidence: {Math.round(convergence.replayConfidence * 100)}%</p>
            <p>Survivability confidence: {Math.round(convergence.survivabilityConfidence * 100)}%</p>
            <p>Orphaned operations: {convergence.orphanedOperations.length}</p>
            <p>Unstable dependencies: {convergence.unstableDependencies.length}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
