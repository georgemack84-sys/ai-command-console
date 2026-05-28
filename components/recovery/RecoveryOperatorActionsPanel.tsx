import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { OperatorActionResult } from "@/types/recoveryOperatorApi";

function actionLabel(action: string) {
  return action.replaceAll("_", " ");
}

export function RecoveryOperatorActionsPanel({
  actions,
  onRequestVerification,
  onDismissAdvisory,
  onEscalateAdvisory,
  onViewEvidence,
}: {
  actions: OperatorActionResult[];
  onRequestVerification: () => void;
  onDismissAdvisory: () => void;
  onEscalateAdvisory: () => void;
  onViewEvidence: () => void;
}) {
  const byAction = new Map(actions.map((action) => [action.action, action]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Operator Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => (
          <div key={action.action} className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">{actionLabel(action.action)}</p>
                {action.reason ? <p className="mt-1 text-xs text-slate-400">{action.reason}</p> : null}
              </div>
              <span className={action.allowed ? "text-xs text-emerald-200" : "text-xs text-amber-200"}>
                {action.allowed ? "allowed" : "blocked"}
              </span>
            </div>
          </div>
        ))}

        <div className="grid gap-2 md:grid-cols-2">
          <Button
            variant="outline"
            onClick={onRequestVerification}
            disabled={!byAction.get("REQUEST_VERIFICATION")?.allowed}
          >
            Request verification
          </Button>
          <Button
            variant="outline"
            onClick={onDismissAdvisory}
            disabled={!byAction.get("DISMISS_ADVISORY")?.allowed}
          >
            Dismiss advisory
          </Button>
          <Button
            variant="outline"
            onClick={onEscalateAdvisory}
            disabled={!byAction.get("ESCALATE_ADVISORY")?.allowed}
          >
            Escalate advisory
          </Button>
          <Button
            variant="secondary"
            onClick={onViewEvidence}
            disabled={!byAction.get("VIEW_EVIDENCE")?.allowed}
          >
            View evidence
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

