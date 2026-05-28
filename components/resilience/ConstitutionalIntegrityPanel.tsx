import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function ConstitutionalIntegrityPanel(props: {
  constitutionalIntegrity: number;
  governanceContinuity: number;
  survivabilityConfidence: number;
  continuityStatus: string;
  operationalStability: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Constitutional Integrity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p>Constitutional integrity: {Math.round(props.constitutionalIntegrity * 100)}%</p>
        <p>Governance continuity: {Math.round(props.governanceContinuity * 100)}%</p>
        <p>Survivability confidence: {Math.round(props.survivabilityConfidence * 100)}%</p>
        <p>Continuity status: {props.continuityStatus}</p>
        <p>Operational stability: {Math.round(props.operationalStability * 100)}%</p>
      </CardContent>
    </Card>
  );
}
