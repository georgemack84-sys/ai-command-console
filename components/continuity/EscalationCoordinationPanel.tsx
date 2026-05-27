"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { RecoveryDashboardReadModel } from "@/services/recovery/verification/recoveryVerificationTypes";

export function EscalationCoordinationPanel({
  escalation,
}: {
  escalation: RecoveryDashboardReadModel["escalationCoordination"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Escalation Coordination</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        {!escalation ? (
          <p className="text-slate-400">Escalation coordination is unavailable until stability evidence is present.</p>
        ) : (
          <>
            <p className="text-white">{escalation.escalationState}</p>
            <p>Type: {escalation.escalationType}</p>
            <p>Severity: {escalation.escalationSeverity}</p>
            <p>Evidence count: {escalation.evidenceCount}</p>
            <p>Operator visibility: {escalation.requiresOperatorVisibility ? "required" : "not required"}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
