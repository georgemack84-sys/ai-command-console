"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { RecoveryDashboardReadModel } from "@/services/recovery/verification/recoveryVerificationTypes";

export function StabilityMetricsPanel({
  stability,
}: {
  stability: RecoveryDashboardReadModel["operationalStabilityAssessment"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stability Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        {!stability ? (
          <p className="text-slate-400">No stability metrics are available yet.</p>
        ) : (
          <>
            <p>Degradation rate: {Math.round(stability.degradationRate * 100)}%</p>
            <p>Recovery pressure: {Math.round(stability.recoveryPressure * 100)}%</p>
            <p>Escalation pressure: {Math.round(stability.escalationPressure * 100)}%</p>
            <p>Continuity confidence: {Math.round(stability.continuityConfidence * 100)}%</p>
            <p>Unstable subsystems: {stability.unstableSubsystems.length ? stability.unstableSubsystems.join(", ") : "none"}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
