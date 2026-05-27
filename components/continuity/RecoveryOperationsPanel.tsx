"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

function renderList(title: string, items: Array<Record<string, unknown>>) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{title}</p>
      {items.length ? (
        <ul className="space-y-2 text-sm text-slate-300">
          {items.map((item, index) => <li key={`${title}-${index}`}>{String(item.executionId || item.reason || "unknown")}</li>)}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">None</p>
      )}
    </div>
  );
}

export function RecoveryOperationsPanel({
  activeRecoveries,
  pendingApprovals,
  blockedRecoveries,
  quarantinedExecutions,
  replayVerificationState,
  certificationState,
}: {
  activeRecoveries: Array<Record<string, unknown>>;
  pendingApprovals: Array<Record<string, unknown>>;
  blockedRecoveries: Array<Record<string, unknown>>;
  quarantinedExecutions: Array<Record<string, unknown>>;
  replayVerificationState: string;
  certificationState: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recovery Operations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-300">Replay: {replayVerificationState}</p>
        <p className="text-sm text-slate-300">Certification: {certificationState}</p>
        {renderList("Active recoveries", activeRecoveries)}
        {renderList("Pending approvals", pendingApprovals)}
        {renderList("Blocked recoveries", blockedRecoveries)}
        {renderList("Quarantined executions", quarantinedExecutions)}
      </CardContent>
    </Card>
  );
}
