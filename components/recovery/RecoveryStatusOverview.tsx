import { RecoveryStateCard } from "@/components/recovery/RecoveryStateCard";
import type { OperatorView } from "@/types/recoveryOperatorApi";
import type { RecoveryEvidenceBundle } from "@/types/recoveryEvidence";
import type { SystemState } from "@/types/recoveryDashboard";

function stateTone(systemState: SystemState) {
  if (systemState === "normal") return "good" as const;
  if (systemState === "disputed") return "danger" as const;
  if (systemState === "partial") return "warning" as const;
  return "default" as const;
}

export function RecoveryStatusOverview({
  systemState,
  operatorView,
  evidence,
}: {
  systemState: SystemState;
  operatorView: OperatorView;
  evidence: RecoveryEvidenceBundle | null;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <RecoveryStateCard
        testId="system-state-card"
        title="System State"
        value={systemState.toUpperCase()}
        detail={`Timeline match: ${operatorView.timelineMatchesReadModel ? "confirmed" : "disputed"}`}
        tone={stateTone(systemState)}
      />
      <RecoveryStateCard
        title="Operator Attention"
        value={operatorView.readModel.risk.requiresOperatorAttention ? "ATTENTION REQUIRED" : "STABLE"}
        detail={`Warnings: ${operatorView.warnings.length}`}
        tone={operatorView.readModel.risk.requiresOperatorAttention ? "warning" : "good"}
      />
      <RecoveryStateCard
        title="Evidence"
        value={evidence ? "EVIDENCE AVAILABLE" : "UNAVAILABLE"}
        detail={evidence ? `Hash: ${evidence.integrity.hash.slice(0, 12)}...` : "No exportable bundle loaded yet."}
        tone={evidence?.state === "disputed" ? "danger" : evidence ? "good" : "default"}
      />
    </section>
  );
}

