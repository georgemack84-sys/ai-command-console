import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { ReadinessDrift } from "@/services/readiness/readinessDriftAnalysis";

export function ReadinessDriftPanel(props: {
  drifts: ReadinessDrift[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Readiness Drift</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        {props.drifts.length === 0 ? <p>No readiness drift detected.</p> : props.drifts.map((drift) => (
          <p key={drift.domain}>
            {drift.domain}: {Math.round(drift.degradationVelocity * 100)}% degradation velocity
          </p>
        ))}
      </CardContent>
    </Card>
  );
}
