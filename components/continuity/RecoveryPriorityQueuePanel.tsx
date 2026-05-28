"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { RecoveryDashboardReadModel } from "@/services/recovery/verification/recoveryVerificationTypes";

export function RecoveryPriorityQueuePanel({
  prioritization,
}: {
  prioritization: RecoveryDashboardReadModel["recoveryPrioritization"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recovery Priority Queue</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        {!prioritization ? (
          <p className="text-slate-400">Recovery prioritization remains unavailable until convergence, stability, and verification evidence align.</p>
        ) : (
          <>
            <p className="text-white">Approved: {prioritization.prioritizationApproved ? "yes" : "no"}</p>
            <p>Queue: {prioritization.recoveryQueue.length ? prioritization.recoveryQueue.join(", ") : "none"}</p>
            <p>Blocked: {prioritization.blockedRecoveries.length}</p>
            <p>Disputed: {prioritization.disputedRecoveries.length}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
