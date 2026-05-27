import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { RecoveryDecisionIntelligenceResult } from "@/services/decision/recoveryDecisionTypes";

export function RecoveryAuthorizationPanel({
  decision,
}: {
  decision: RecoveryDecisionIntelligenceResult;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recovery Authorization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        <p className="text-white">{decision.recommendedAction}</p>
        <p>Mutable: {decision.mutable ? "yes" : "no"}</p>
        <p>Confidence: {Math.round(decision.decisionConfidence * 100)}%</p>
        <p>Uncertainty: {decision.uncertaintyLevel}</p>
      </CardContent>
    </Card>
  );
}
