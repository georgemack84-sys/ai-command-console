"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { RecoveryDashboardReadModel } from "@/services/recovery/verification/recoveryVerificationTypes";

export function RecoveryStarvationCard({
  prioritization,
}: {
  prioritization: RecoveryDashboardReadModel["recoveryPrioritization"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recovery Starvation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        {!prioritization ? (
          <p className="text-slate-400">Starvation analysis is unavailable until a queue can be derived safely.</p>
        ) : (
          <>
            <p className="text-white">Warnings: {prioritization.starvationWarnings.length}</p>
            <p>{prioritization.starvationWarnings.length ? prioritization.starvationWarnings.join(", ") : "No starvation warnings."}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
