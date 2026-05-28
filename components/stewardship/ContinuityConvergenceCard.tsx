import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { SupervisoryControlView } from "@/services/stewardship/supervisoryControlView";

export function ContinuityConvergenceCard({
  convergence,
}: {
  convergence: SupervisoryControlView["convergence"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Continuity Convergence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        <p className="text-white">{convergence.converged ? "CONVERGED" : "DIVERGING"}</p>
        <p>Divergence score: {Math.round(convergence.divergenceScore * 100)}%</p>
        <p>Containment: {convergence.requiresContainment ? "required" : "not required"}</p>
        <p>Escalation: {convergence.requiresEscalation ? "required" : "not required"}</p>
        <p>Continuity confidence: {Math.round(convergence.continuityConfidence * 100)}%</p>
        <p>Reasons: {convergence.divergenceReasons.length ? convergence.divergenceReasons.join(", ") : "none"}</p>
      </CardContent>
    </Card>
  );
}
