import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import type { OperatorView } from "@/types/recoveryOperatorApi";
import type { RecoveryEvidenceBundle } from "@/types/recoveryEvidence";

function buildWarnings(operatorView: OperatorView, evidence: RecoveryEvidenceBundle | null) {
  const warnings = new Set<string>();
  evidence?.meta.warnings.forEach((warning) => warnings.add(warning));
  operatorView.warnings.forEach((warning) => warnings.add(warning));
  if (!operatorView.timelineMatchesReadModel) {
    warnings.add("Evidence indicates system inconsistency. Timeline does not explain current state.");
  }
  if (operatorView.readModel.risk.hasVerificationFailure) {
    warnings.add("Verification has reported a failure.");
  }
  if (operatorView.readModel.risk.hasStaleLock) {
    warnings.add("A stale lock is present.");
  }
  if (operatorView.readModel.risk.hasOpenAdvisory) {
    warnings.add("An advisory remains open or escalated.");
  }
  return Array.from(warnings);
}

export function RecoveryWarningBanner({
  operatorView,
  evidence,
}: {
  operatorView: OperatorView;
  evidence: RecoveryEvidenceBundle | null;
}) {
  const warnings = buildWarnings(operatorView, evidence);
  if (warnings.length === 0) {
    return null;
  }

  return (
    <Card className="border-amber-300/20 bg-amber-300/10">
      <CardContent className="pt-6">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-100" />
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-50">Warnings</p>
            <ul className="space-y-1 text-sm text-amber-100/90">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

