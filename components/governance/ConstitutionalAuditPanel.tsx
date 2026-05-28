import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function ConstitutionalAuditPanel({
  evidence,
  denialHistory,
  enforcementEvents,
  disputes,
  emergencyInterventions,
  replayMismatches,
  escalationLineage,
  operatorDecisions,
  freezeEvents,
  sovereigntyInterventions,
}: {
  evidence: string[];
  denialHistory: string[];
  enforcementEvents: string[];
  disputes: string[];
  emergencyInterventions: string[];
  replayMismatches: string[];
  escalationLineage: string[];
  operatorDecisions: string[];
  freezeEvents: string[];
  sovereigntyInterventions: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Constitutional Audit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p>Evidence: {evidence.length ? evidence.join(", ") : "none"}</p>
        <p>Denials: {denialHistory.length ? denialHistory.join(", ") : "none"}</p>
        <p>Enforcement events: {enforcementEvents.length ? enforcementEvents.join(", ") : "none"}</p>
        <p>Disputes: {disputes.length ? disputes.join(", ") : "none"}</p>
        <p>Emergency interventions: {emergencyInterventions.length ? emergencyInterventions.join(", ") : "none"}</p>
        <p>Replay mismatches: {replayMismatches.length ? replayMismatches.join(", ") : "none"}</p>
        <p>Escalation lineage: {escalationLineage.length ? escalationLineage.join(", ") : "none"}</p>
        <p>Operator decisions: {operatorDecisions.length ? operatorDecisions.join(", ") : "none"}</p>
        <p>Freeze events: {freezeEvents.length ? freezeEvents.join(", ") : "none"}</p>
        <p>Sovereignty interventions: {sovereigntyInterventions.length ? sovereigntyInterventions.join(", ") : "none"}</p>
      </CardContent>
    </Card>
  );
}
