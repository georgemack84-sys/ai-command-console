import type { ConstitutionalSimulationResult } from "@/services/simulation/constitutionalSimulationEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function ConstitutionalSimulationPanel({
  simulations,
}: {
  simulations: ConstitutionalSimulationResult[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Constitutional Simulation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        {simulations.map((simulation) => (
          <div key={simulation.simulationId} className="rounded border border-white/10 p-3">
            <p className="text-white">{simulation.simulationType}</p>
            <p>Deterministic: {simulation.deterministic ? "yes" : "no"}</p>
            <p>Constitutional safe: {simulation.constitutionalSafe ? "yes" : "no"}</p>
            <p>Survivability: {Math.round(simulation.survivabilityScore * 100)}%</p>
            <p>Escalation risk: {Math.round(simulation.escalationRisk * 100)}%</p>
            <p>Containment failure: {Math.round(simulation.containmentFailureProbability * 100)}%</p>
            <p>Governance forecast: {Math.round(simulation.governanceIntegrityForecast * 100)}%</p>
            <p>Uncertainty: {Math.round(simulation.uncertaintyLevel * 100)}%</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
