import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function EmergencyContinuityPanel(props: {
  emergencyContinuityOperations: string[];
  survivabilityProtocols: string[];
  stabilizationRouting: string;
  containmentEscalation: string[];
  operatorInterventionRequirements: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Emergency Continuity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p>Emergency continuity operations: {props.emergencyContinuityOperations.join(", ")}</p>
        <p>Survivability protocols: {props.survivabilityProtocols.join(", ")}</p>
        <p>Stabilization routing: {props.stabilizationRouting}</p>
        <p>Containment escalation: {props.containmentEscalation.length ? props.containmentEscalation.join(", ") : "none"}</p>
        <p>Operator intervention: {props.operatorInterventionRequirements.length ? props.operatorInterventionRequirements.join(", ") : "none"}</p>
      </CardContent>
    </Card>
  );
}
