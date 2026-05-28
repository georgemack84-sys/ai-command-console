"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function GovernanceVisibilityPanel({
  deniedRecoveryAttempts,
  approvalRequirements,
  auditEvidence,
  recoveryDisputes,
  escalationEvents,
}: {
  deniedRecoveryAttempts: Array<Record<string, unknown>>;
  approvalRequirements: Array<Record<string, unknown>>;
  auditEvidence: Array<Record<string, unknown>>;
  recoveryDisputes: string[];
  escalationEvents: Array<Record<string, unknown>>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Governance Visibility</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-300">Denied attempts: {deniedRecoveryAttempts.length}</p>
        <p className="text-sm text-slate-300">Approval requirements: {approvalRequirements.length}</p>
        <p className="text-sm text-slate-300">Audit evidence entries: {auditEvidence.length}</p>
        <p className="text-sm text-slate-300">Escalations: {escalationEvents.length}</p>
        {recoveryDisputes.length ? (
          <ul className="space-y-1 text-sm text-amber-200">
            {recoveryDisputes.map((dispute) => <li key={dispute}>{dispute}</li>)}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">No governance disputes.</p>
        )}
      </CardContent>
    </Card>
  );
}
