"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { RecoveryDashboardReadModel } from "@/services/recovery/verification/recoveryVerificationTypes";

export function RecoveryStewardshipPanel({
  stewardship,
}: {
  stewardship: RecoveryDashboardReadModel["stewardship"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recovery Stewardship</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        {!stewardship ? (
          <p className="text-slate-400">Stewardship is unavailable until verified recovery truth is present.</p>
        ) : (
          <>
            <p className="text-white">{stewardship.state}</p>
            <p>Confidence: {Math.round(stewardship.confidence * 100)}%</p>
            <p>Freeze: {stewardship.shouldFreeze ? "required" : "not required"}</p>
            <p>Contain: {stewardship.shouldContain ? "required" : "not required"}</p>
            <p>Escalate: {stewardship.shouldEscalate ? "required" : "not required"}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
