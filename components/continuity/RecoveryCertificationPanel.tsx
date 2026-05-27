"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function RecoveryCertificationPanel({
  certificationDecision,
  continuationAllowed,
  requiresOperatorReview,
  quarantineState,
}: {
  certificationDecision: string;
  continuationAllowed: boolean;
  requiresOperatorReview: boolean;
  quarantineState: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recovery Certification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-white">{certificationDecision}</p>
        <p className="text-sm text-slate-300">Continuation allowed: {continuationAllowed ? "yes" : "no"}</p>
        <p className="text-sm text-slate-300">Operator review required: {requiresOperatorReview ? "yes" : "no"}</p>
        <p className="text-sm text-slate-300">Quarantine state: {quarantineState ? "active" : "none"}</p>
      </CardContent>
    </Card>
  );
}
