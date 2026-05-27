"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { RecoveryDashboardReadModel } from "@/services/recovery/verification/recoveryVerificationTypes";

export function ConvergenceConfidenceCard({
  convergence,
}: {
  convergence: RecoveryDashboardReadModel["continuityConvergence"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Convergence Confidence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        {!convergence ? (
          <p className="text-slate-400">Convergence confidence is unavailable until verified signals can be reconciled.</p>
        ) : (
          <>
            <p>Continuity confidence: {Math.round(convergence.continuityConfidence * 100)}%</p>
            <p>Replay confidence: {Math.round(convergence.replayConfidence * 100)}%</p>
            <p>Survivability confidence: {Math.round(convergence.survivabilityConfidence * 100)}%</p>
            <p>Escalation stability confidence: {Math.round(convergence.escalationStabilityConfidence * 100)}%</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
