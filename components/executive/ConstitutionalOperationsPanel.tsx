import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { OperationalSurvivabilityCard } from "@/services/executive/executiveOperationsAggregator";
import type { GovernancePressureMatrix } from "@/services/executive/governancePressureAnalysis";

export function ConstitutionalOperationsPanel({
  constitutionalState,
  governancePressure,
  survivability,
  activeDisputes,
  containmentAction,
  approvalBacklog,
  governanceDegradation,
  freezeVisible,
}: {
  constitutionalState: string;
  governancePressure: GovernancePressureMatrix;
  survivability: OperationalSurvivabilityCard;
  activeDisputes: string[];
  containmentAction: string;
  approvalBacklog: number;
  governanceDegradation: number;
  freezeVisible: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Constitutional Operations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p className="text-white">{constitutionalState}</p>
        <p>Governance pressure: {Math.round(governancePressure.operationalRisk * 100)}%</p>
        <p>Survivability: {survivability.survivabilityState}</p>
        <p>Active disputes: {activeDisputes.length ? activeDisputes.join(", ") : "none"}</p>
        <p>Containment action: {containmentAction}</p>
        <p>Approval backlog: {approvalBacklog}</p>
        <p>Governance degradation: {Math.round(governanceDegradation * 100)}%</p>
        <p>Constitutional freeze: {freezeVisible ? "visible" : "clear"}</p>
      </CardContent>
    </Card>
  );
}
