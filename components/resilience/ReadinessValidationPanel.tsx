import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function ReadinessValidationPanel(props: {
  readinessConfidence: number;
  readinessState: string;
  governanceReliability: number;
  enforcementConsistency: number;
  operatorReviewRequirements: string[];
  blockedReadinessDomains: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Readiness Validation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p>Readiness confidence: {Math.round(props.readinessConfidence * 100)}%</p>
        <p>Readiness state: {props.readinessState}</p>
        <p>Governance reliability: {Math.round(props.governanceReliability * 100)}%</p>
        <p>Enforcement consistency: {Math.round(props.enforcementConsistency * 100)}%</p>
        <p>Operator review: {props.operatorReviewRequirements.length ? props.operatorReviewRequirements.join(", ") : "none"}</p>
        <p>Blocked domains: {props.blockedReadinessDomains.length ? props.blockedReadinessDomains.join(", ") : "none"}</p>
      </CardContent>
    </Card>
  );
}
