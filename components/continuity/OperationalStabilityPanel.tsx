"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { RecoveryDashboardReadModel } from "@/services/recovery/verification/recoveryVerificationTypes";

export function OperationalStabilityPanel({
  stability,
}: {
  stability: RecoveryDashboardReadModel["operationalStabilityAssessment"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Operational Stability</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        {!stability ? (
          <p className="text-slate-400">Operational stability is unavailable until verified continuity and stewardship signals are present.</p>
        ) : (
          <>
            <p className="text-white">{stability.operationalState}</p>
            <p>Survivability: {Math.round(stability.survivabilityScore * 100)}%</p>
            <p>Trend: {stability.trend}</p>
            <p>Stabilization: {stability.stabilizationRequired ? "required" : "not required"}</p>
            <p>Containment: {stability.containmentRecommended ? "recommended" : "not recommended"}</p>
            <p>Lockdown: {stability.lockdownRecommended ? "recommended" : "not recommended"}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
