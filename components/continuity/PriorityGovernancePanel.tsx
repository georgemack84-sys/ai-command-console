"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { RecoveryDashboardReadModel } from "@/services/recovery/verification/recoveryVerificationTypes";

export function PriorityGovernancePanel({
  prioritization,
}: {
  prioritization: RecoveryDashboardReadModel["recoveryPrioritization"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Priority Governance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        {!prioritization ? (
          <p className="text-slate-400">Governance visibility is unavailable until prioritization evidence is available.</p>
        ) : (
          <>
            <p className="text-white">Review required: {prioritization.governanceReviewRequired ? "yes" : "no"}</p>
            <p>Deterministic ordering: {prioritization.deterministicOrderingVerified ? "verified" : "unverified"}</p>
            <p>Reasons: {prioritization.prioritizationReasons.length ? prioritization.prioritizationReasons.join(", ") : "none"}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
