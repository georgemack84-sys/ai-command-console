import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { OperationalSurvivabilityCard as OperationalSurvivabilityCardModel } from "@/services/executive/executiveOperationsAggregator";

export function OperationalSurvivabilityCard({
  survivability,
}: {
  survivability: OperationalSurvivabilityCardModel;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Operational Survivability</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p className="text-white">{survivability.survivabilityState}</p>
        <p>Continuity confidence: {Math.round(survivability.continuityConfidence * 100)}%</p>
        <p>Collapse probability: {Math.round(survivability.collapseProbability * 100)}%</p>
        <p>Stabilization confidence: {Math.round(survivability.stabilizationConfidence * 100)}%</p>
        <p>Degradation velocity: {Math.round(survivability.degradationVelocity * 100)}%</p>
        <p>Strategic threat: {Math.round(survivability.strategicThreatLevel * 100)}%</p>
      </CardContent>
    </Card>
  );
}
