"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { RecoveryDashboardReadModel } from "@/services/recovery/verification/recoveryVerificationTypes";

export function EscalationLineagePanel({
  escalation,
}: {
  escalation: RecoveryDashboardReadModel["escalationCoordination"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Escalation Lineage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        {!escalation ? (
          <p className="text-slate-400">No escalation lineage is available yet.</p>
        ) : (
          <>
            <p>Lineage: {escalation.escalationLineageId}</p>
            <p>Parent: {escalation.parentEscalationId || "none"}</p>
            <p>Frozen: {escalation.frozen ? "yes" : "no"}</p>
            <p>Blocked: {escalation.blocked ? "yes" : "no"}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
