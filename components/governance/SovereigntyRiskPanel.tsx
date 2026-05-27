import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function SovereigntyRiskPanel({
  sovereigntyState,
  systemicRisk,
  survivabilityRisk,
  governanceDegradation,
  escalationSaturation,
  containmentEffectiveness,
  sovereigntyConfidence,
  unstableDomains,
  emergencyContainmentState,
  constitutionalSurvivabilityStatus,
}: {
  sovereigntyState: string;
  systemicRisk: number;
  survivabilityRisk: number;
  governanceDegradation: number;
  escalationSaturation: number;
  containmentEffectiveness: number;
  sovereigntyConfidence: number;
  unstableDomains: string[];
  emergencyContainmentState: boolean;
  constitutionalSurvivabilityStatus: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sovereignty Risk</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p className="text-white">{sovereigntyState}</p>
        <p>Systemic risk: {Math.round(systemicRisk * 100)}%</p>
        <p>Survivability risk: {Math.round(survivabilityRisk * 100)}%</p>
        <p>Governance degradation: {Math.round(governanceDegradation * 100)}%</p>
        <p>Escalation saturation: {Math.round(escalationSaturation * 100)}%</p>
        <p>Containment effectiveness: {Math.round(containmentEffectiveness * 100)}%</p>
        <p>Sovereignty confidence: {Math.round(sovereigntyConfidence * 100)}%</p>
        <p>Unstable domains: {unstableDomains.length ? unstableDomains.join(", ") : "none"}</p>
        <p>Emergency containment: {emergencyContainmentState ? "active" : "inactive"}</p>
        <p>Constitutional survivability: {constitutionalSurvivabilityStatus}</p>
      </CardContent>
    </Card>
  );
}
