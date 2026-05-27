"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function RecoveryVerificationPanel({
  status,
  verified,
  disputed,
  divergenceDetected,
  evidenceCount,
  warnings,
  errors,
}: {
  status: string;
  verified: boolean;
  disputed: boolean;
  divergenceDetected: boolean;
  evidenceCount: number;
  warnings: string[];
  errors: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recovery Verification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-white">{status}</p>
        <p className="text-sm text-slate-300">Verified: {verified ? "yes" : "no"}</p>
        <p className="text-sm text-slate-300">Disputed: {disputed ? "yes" : "no"}</p>
        <p className="text-sm text-slate-300">Replay divergence: {divergenceDetected ? "detected" : "none"}</p>
        <p className="text-sm text-slate-300">Evidence count: {evidenceCount}</p>
        {warnings.length ? <ul className="space-y-1 text-sm text-amber-200">{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : null}
        {errors.length ? <ul className="space-y-1 text-sm text-rose-200">{errors.map((error) => <li key={error}>{error}</li>)}</ul> : null}
      </CardContent>
    </Card>
  );
}
