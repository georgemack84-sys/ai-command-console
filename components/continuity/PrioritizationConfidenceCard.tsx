"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { RecoveryDashboardReadModel } from "@/services/recovery/verification/recoveryVerificationTypes";

export function PrioritizationConfidenceCard({
  prioritization,
}: {
  prioritization: RecoveryDashboardReadModel["recoveryPrioritization"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Prioritization Confidence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        {!prioritization ? (
          <p className="text-slate-400">Confidence is withheld until prioritization evidence is complete.</p>
        ) : (
          <>
            <p className="text-white">{Math.round(prioritization.prioritizationConfidence * 100)}%</p>
            <p>Governance review: {prioritization.governanceReviewRequired ? "required" : "not required"}</p>
            <p>Containment priority: {prioritization.containmentPriorityRequired ? "required" : "not required"}</p>
            <p>Survivability priority: {prioritization.survivabilityPriorityRequired ? "required" : "not required"}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
