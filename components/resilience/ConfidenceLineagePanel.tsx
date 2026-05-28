import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { ConfidenceLineage } from "@/services/readiness/confidenceLineage";

export function ConfidenceLineagePanel(props: {
  lineage: ConfidenceLineage[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Confidence Lineage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        {props.lineage.map((entry) => (
          <div key={entry.sourceSystem} className="space-y-1">
            <p className="text-white">{entry.sourceSystem}</p>
            <p>Derived from: {entry.derivedFrom.join(", ")}</p>
            <p>Inherited constraints: {entry.inheritedConstraints.length ? entry.inheritedConstraints.join(", ") : "none"}</p>
            <p>Disputed signals: {entry.disputedSignals.length ? entry.disputedSignals.join(", ") : "none"}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
