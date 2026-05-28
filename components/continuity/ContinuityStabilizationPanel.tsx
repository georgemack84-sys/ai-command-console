"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { RecoveryDashboardReadModel } from "@/services/recovery/verification/recoveryVerificationTypes";

export function ContinuityStabilizationPanel({
  stewardship,
}: {
  stewardship: RecoveryDashboardReadModel["stewardship"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Continuity Stabilization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        {!stewardship ? (
          <p className="text-slate-400">Stabilization status will appear after stewardship evaluates verified recovery truth.</p>
        ) : (
          <>
            <p>Status: {stewardship.stabilizationStatus}</p>
            <p>Survivability: {Math.round(stewardship.survivabilityScore * 100)}%</p>
            <p>Governance blocked: {stewardship.governanceBlocked ? "yes" : "no"}</p>
            <p>Verification blocked: {stewardship.verificationBlocked ? "yes" : "no"}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
