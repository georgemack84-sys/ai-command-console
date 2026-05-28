"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { RecoveryDashboardReadModel } from "@/services/recovery/verification/recoveryVerificationTypes";

export function DivergenceDetectionPanel({
  convergence,
}: {
  convergence: RecoveryDashboardReadModel["continuityConvergence"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Divergence Detection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        {!convergence ? (
          <p className="text-slate-400">No divergence summary is available yet.</p>
        ) : (
          <>
            <p>Reasons: {convergence.divergenceReasons.length ? convergence.divergenceReasons.join(", ") : "none"}</p>
            <p>Affected executions: {convergence.affectedExecutions.length ? convergence.affectedExecutions.join(", ") : "none"}</p>
            <p>Affected subsystems: {convergence.affectedSubsystems.length ? convergence.affectedSubsystems.join(", ") : "none"}</p>
            <p>Unresolved disputes: {convergence.unresolvedDisputes.length}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
