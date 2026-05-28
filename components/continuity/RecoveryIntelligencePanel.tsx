"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { RecoveryDashboardReadModel } from "@/services/recovery/verification/recoveryVerificationTypes";

export function RecoveryIntelligencePanel({
  stewardship,
}: {
  stewardship: RecoveryDashboardReadModel["stewardship"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recovery Intelligence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        {!stewardship ? (
          <p className="text-slate-400">No recovery intelligence is available until stewardship can read verified evidence.</p>
        ) : (
          <>
            <p>Collapse risk: {stewardship.collapseRisk}</p>
            <p>Evidence references: {stewardship.evidence.length}</p>
            {stewardship.reasoning.length ? (
              <ul className="space-y-1">
                {stewardship.reasoning.slice(0, 5).map((reason) => <li key={reason}>{reason}</li>)}
              </ul>
            ) : (
              <p className="text-slate-400">No additional stewardship reasoning reported.</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
