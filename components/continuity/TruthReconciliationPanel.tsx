"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function TruthReconciliationPanel({
  reconciliationState,
  mismatches,
  runtimeConsistent,
  governanceConsistent,
  simulationConsistent,
  immutableEvidenceValid,
}: {
  reconciliationState: string;
  mismatches: string[];
  runtimeConsistent: boolean;
  governanceConsistent: boolean;
  simulationConsistent: boolean;
  immutableEvidenceValid: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Truth Reconciliation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-white">{reconciliationState}</p>
        <p className="text-sm text-slate-300">Runtime consistent: {runtimeConsistent ? "yes" : "no"}</p>
        <p className="text-sm text-slate-300">Governance consistent: {governanceConsistent ? "yes" : "no"}</p>
        <p className="text-sm text-slate-300">Simulation consistent: {simulationConsistent ? "yes" : "no"}</p>
        <p className="text-sm text-slate-300">Immutable evidence valid: {immutableEvidenceValid ? "yes" : "no"}</p>
        {mismatches.length ? (
          <ul className="space-y-1 text-sm text-amber-200">
            {mismatches.map((mismatch) => <li key={mismatch}>{mismatch}</li>)}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">No mismatches detected.</p>
        )}
      </CardContent>
    </Card>
  );
}
