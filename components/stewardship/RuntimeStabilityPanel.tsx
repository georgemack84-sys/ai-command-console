import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { SupervisoryControlView } from "@/services/stewardship/supervisoryControlView";

export function RuntimeStabilityPanel({
  runtimeStability,
  resilienceState,
}: {
  runtimeStability: SupervisoryControlView["runtimeStability"];
  resilienceState: SupervisoryControlView["resilience"]["resilienceState"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Runtime Stability</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        <p className="text-white">{runtimeStability.operationalState}</p>
        <p>Resilience: {resilienceState}</p>
        <p>Survivability: {Math.round(runtimeStability.survivabilityScore * 100)}%</p>
        <p>Degradation: {Math.round(runtimeStability.degradationRate * 100)}%</p>
        <p>Escalation pressure: {Math.round(runtimeStability.escalationPressure * 100)}%</p>
        <p>Continuity confidence: {Math.round(runtimeStability.continuityConfidence * 100)}%</p>
        <p>Stabilization: {runtimeStability.stabilizationRequired ? "required" : "not required"}</p>
        <p>Subsystems: {runtimeStability.unstableSubsystems.length ? runtimeStability.unstableSubsystems.join(", ") : "none"}</p>
        <p>Assessed: {runtimeStability.timestamp}</p>
      </CardContent>
    </Card>
  );
}
