"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function RecoverySimulationPanel({
  simulationOutcomes,
}: {
  simulationOutcomes: Array<Record<string, unknown>>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recovery Simulation</CardTitle>
      </CardHeader>
      <CardContent>
        {simulationOutcomes.length ? (
          <ul className="space-y-3 text-sm text-slate-300">
            {simulationOutcomes.map((simulation, index) => (
              <li key={String(simulation.simulationId || `simulation-${index}`)}>
                <p className="font-medium text-white">{String(simulation.scenarioType || "Unknown scenario")}</p>
                <p>{String(simulation.outcome || "Unknown outcome")}</p>
                {Array.isArray(simulation.disputes) && simulation.disputes.length ? (
                  <p>{simulation.disputes.map((value: unknown) => String(value)).join(", ")}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">No simulation outcomes available.</p>
        )}
      </CardContent>
    </Card>
  );
}
