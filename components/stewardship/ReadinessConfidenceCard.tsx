import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { AutonomousRecoveryReadinessAssessment } from "@/services/readiness/readinessTypes";

export function ReadinessConfidenceCard({
  readiness,
}: {
  readiness: AutonomousRecoveryReadinessAssessment;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Readiness Confidence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        <p>Governance: {Math.round(readiness.governanceConfidence * 100)}%</p>
        <p>Simulation trust: {Math.round(readiness.simulationTrustScore * 100)}%</p>
        <p>Rollback confidence: {Math.round(readiness.rollbackConfidence * 100)}%</p>
        <p>Containment confidence: {Math.round(readiness.containmentConfidence * 100)}%</p>
        <p>Convergence confidence: {Math.round(readiness.convergenceConfidence * 100)}%</p>
        <p>Constitutional integrity: {Math.round(readiness.constitutionalIntegrity * 100)}%</p>
      </CardContent>
    </Card>
  );
}
