import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function SurvivabilityStatePanel({
  survivabilityState,
  governanceContinuity,
  auditPreservationConfidence,
  recoverabilityConfidence,
}: {
  survivabilityState: string;
  governanceContinuity: number;
  auditPreservationConfidence: number;
  recoverabilityConfidence: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Survivability State</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p className="text-white">{survivabilityState}</p>
        <p>Governance continuity: {Math.round(governanceContinuity * 100)}%</p>
        <p>Audit survivability: {Math.round(auditPreservationConfidence * 100)}%</p>
        <p>Recoverability: {Math.round(recoverabilityConfidence * 100)}%</p>
      </CardContent>
    </Card>
  );
}
