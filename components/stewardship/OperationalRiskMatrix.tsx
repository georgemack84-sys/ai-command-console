import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { RecoveryDashboardReadModel } from "@/services/recovery/verification/recoveryVerificationTypes";
import type { ConstitutionalResilienceAssessment } from "@/services/resilience/resilienceTypes";

export function OperationalRiskMatrix({
  prioritization,
  resilience,
}: {
  prioritization: RecoveryDashboardReadModel["recoveryPrioritization"];
  resilience: ConstitutionalResilienceAssessment;
}) {
  const top = prioritization?.assessments[0] || null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Operational Risk Matrix</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        {!top ? (
          <p className="text-slate-400">Risk matrix unavailable until prioritization evidence is complete.</p>
        ) : (
          <>
            <p>Operational criticality: {Math.round(top.prioritizationScore * 100)}%</p>
            <p>Governance review: {top.governanceReviewRequired ? "required" : "not required"}</p>
            <p>Priority category: {top.category}</p>
            <p>Priority state: {top.state}</p>
            <p>Resilience state: {resilience.resilienceState}</p>
            <p>Operational risk: {Math.round(resilience.operationalRiskScore * 100)}%</p>
            <p>Collapse probability: {Math.round(resilience.collapseProbability * 100)}%</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
