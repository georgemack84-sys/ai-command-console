"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { RecoveryDashboardReadModel } from "@/services/recovery/verification/recoveryVerificationTypes";

export function ContinuityConvergencePanel({
  convergence,
}: {
  convergence: RecoveryDashboardReadModel["continuityConvergence"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Continuity Convergence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        {!convergence ? (
          <p className="text-slate-400">Convergence intelligence is unavailable until continuity evidence can be correlated.</p>
        ) : (
          <>
            <p className="text-white">{convergence.state}</p>
            <p>Divergence score: {Math.round(convergence.divergenceScore * 100)}%</p>
            <p>Freeze: {convergence.requiresFreeze ? "required" : "not required"}</p>
            <p>Escalation: {convergence.requiresEscalation ? "recommended" : "not recommended"}</p>
            <p>Containment: {convergence.requiresContainment ? "recommended" : "not recommended"}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
