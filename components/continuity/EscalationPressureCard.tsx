"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { RecoveryDashboardReadModel } from "@/services/recovery/verification/recoveryVerificationTypes";

export function EscalationPressureCard({
  stability,
  escalation,
}: {
  stability: RecoveryDashboardReadModel["operationalStabilityAssessment"];
  escalation: RecoveryDashboardReadModel["escalationCoordination"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Escalation Pressure</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        {!stability ? (
          <p className="text-slate-400">Escalation pressure becomes visible once stability metrics are available.</p>
        ) : (
          <>
            <p>Pressure: {Math.round(stability.escalationPressure * 100)}%</p>
            <p>Recovery pressure: {Math.round(stability.recoveryPressure * 100)}%</p>
            <p>Recommended review: {escalation?.recommendedActions[0] || "none"}</p>
            <p>Containment: {escalation?.requiresContainment ? "required" : "not required"}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
