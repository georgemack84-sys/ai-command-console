"use client";

import { useEffect, useMemo, useState } from "react";
import { SectionShell } from "@/src/components/ui/section-shell";
import type { RecoveryDashboardReadModel } from "@/services/recovery/verification/recoveryVerificationTypes";
import { RuntimeContinuityPanel } from "./RuntimeContinuityPanel";
import { RecoveryOperationsPanel } from "./RecoveryOperationsPanel";
import { GovernanceVisibilityPanel } from "./GovernanceVisibilityPanel";
import { ContinuityRiskCard } from "./ContinuityRiskCard";
import { RecoveryVerificationPanel } from "./RecoveryVerificationPanel";
import { TruthReconciliationPanel } from "./TruthReconciliationPanel";
import { ReplayIntegrityPanel } from "./ReplayIntegrityPanel";
import { RecoveryCertificationPanel } from "./RecoveryCertificationPanel";
import { RecoverySimulationPanel } from "./RecoverySimulationPanel";
import { ContinuityTimelinePanel } from "./ContinuityTimelinePanel";
import { RecoveryStewardshipPanel } from "./RecoveryStewardshipPanel";
import { RecoveryIntelligencePanel } from "./RecoveryIntelligencePanel";
import { ContinuityStabilizationPanel } from "./ContinuityStabilizationPanel";
import { OperationalStabilityPanel } from "./OperationalStabilityPanel";
import { StabilityMetricsPanel } from "./StabilityMetricsPanel";
import { EscalationCoordinationPanel } from "./EscalationCoordinationPanel";
import { EscalationLineagePanel } from "./EscalationLineagePanel";
import { EscalationPressureCard } from "./EscalationPressureCard";
import { ContinuityConvergencePanel } from "./ContinuityConvergencePanel";
import { DivergenceDetectionPanel } from "./DivergenceDetectionPanel";
import { OperationalDriftCard } from "./OperationalDriftCard";
import { ConvergenceConfidenceCard } from "./ConvergenceConfidenceCard";
import { RecoveryPriorityQueuePanel } from "./RecoveryPriorityQueuePanel";
import { PrioritizationConfidenceCard } from "./PrioritizationConfidenceCard";
import { PriorityGovernancePanel } from "./PriorityGovernancePanel";
import { RecoveryStarvationCard } from "./RecoveryStarvationCard";

async function fetchContinuityDashboard(): Promise<RecoveryDashboardReadModel> {
  const response = await fetch("/api/operations/continuity", { cache: "no-store" });
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload?.error?.message || "Unable to load continuity dashboard.");
  }
  return payload.data as RecoveryDashboardReadModel;
}

export function ContinuityDashboardClient() {
  const [data, setData] = useState<RecoveryDashboardReadModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchContinuityDashboard()
      .then(setData)
      .catch((nextError) => setError(nextError instanceof Error ? nextError.message : "Unable to load continuity dashboard."));
  }, []);

  const latestBlocked = useMemo(() => data?.blockedRecoveries[0] || null, [data?.blockedRecoveries]);
  const latestQuarantine = useMemo(() => data?.quarantinedExecutions[0] || null, [data?.quarantinedExecutions]);

  return (
    <div className="space-y-6">
      <SectionShell className="p-6 sm:p-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-sky-200">Operational Continuity</p>
          <h2 className="font-display text-3xl font-semibold text-white">Governed recovery verification dashboard</h2>
          <p className="text-sm text-slate-300">Replay truth, runtime continuity, governance disputes, simulation outcomes, and certification state in one read-only surface.</p>
        </div>
      </SectionShell>

      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
      {!data && !error ? <p className="text-sm text-slate-300">Loading continuity dashboard...</p> : null}

      {data ? (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <RuntimeContinuityPanel
              runtimeState={data.runtimeContinuityState}
              continuityConfidence={data.continuityConfidence}
              operationalStability={data.operationalStability}
              degradedSystems={data.degradedSystems}
              staleLockSummary={`${data.leaseConflicts.length} lease conflicts`}
            />
            <ContinuityRiskCard
              continuityRiskScore={data.continuityRiskScore}
              contributors={[
                ...(data.degradedSystems.length ? data.degradedSystems : ["no major degraded systems"]),
                ...(data.replayDivergenceCount > 0 ? [`${data.replayDivergenceCount} replay divergences`] : []),
              ]}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <RecoveryOperationsPanel
              activeRecoveries={data.activeRecoveries}
              pendingApprovals={data.pendingApprovals}
              blockedRecoveries={data.blockedRecoveries}
              quarantinedExecutions={data.quarantinedExecutions}
              replayVerificationState={data.replayVerificationState}
              certificationState={data.certificationState}
            />
            <GovernanceVisibilityPanel
              deniedRecoveryAttempts={data.blockedRecoveries}
              approvalRequirements={data.pendingApprovals}
              auditEvidence={data.auditHistory}
              recoveryDisputes={data.governanceDisputes.flatMap((entry) => Array.isArray(entry.disputes) ? entry.disputes.map((value) => String(value)) : [])}
              escalationEvents={data.auditHistory.filter((event) => String(event.type || "").includes("escalat"))}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <RecoveryVerificationPanel
              status={data.replayVerificationState}
              verified={data.replayVerificationState === "VERIFIED"}
              disputed={data.governanceDisputes.length > 0}
              divergenceDetected={data.replayDivergenceCount > 0}
              evidenceCount={data.auditHistory.length}
              warnings={latestBlocked ? [String(latestBlocked.status || "blocked")] : []}
              errors={data.governanceDisputes.flatMap((entry) => Array.isArray(entry.disputes) ? entry.disputes.map((value) => String(value)) : [])}
            />
            <TruthReconciliationPanel
              reconciliationState={data.certificationState === "CERTIFIED" ? "RECONCILED" : data.replayDivergenceCount > 0 ? "DIVERGED" : data.governanceDisputes.length > 0 ? "DISPUTED" : "PARTIALLY_RECONCILED"}
              mismatches={data.governanceDisputes.flatMap((entry) => Array.isArray(entry.disputes) ? entry.disputes.map((value) => String(value)) : [])}
              runtimeConsistent={data.runtimeContinuityState !== "UNVERIFIABLE"}
              governanceConsistent={data.governanceDisputes.length === 0}
              simulationConsistent={data.simulationOutcomes.every((entry) => String(entry.outcome || "") !== "REPLAY_DIVERGENCE_DETECTED")}
              immutableEvidenceValid={data.auditHistory.every((entry) => String(entry.type || "") !== "parse_error")}
            />
            <ReplayIntegrityPanel
              replayVerificationState={data.replayVerificationState}
              replayDivergenceCount={data.replayDivergenceCount}
              checkpointIntegrity={data.replayDivergenceCount === 0}
              lineageIntegrity={data.replayDivergenceCount === 0}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <RecoveryCertificationPanel
              certificationDecision={data.certificationState}
              continuationAllowed={["CERTIFIED", "CERTIFIED_WITH_WARNINGS"].includes(data.certificationState)}
              requiresOperatorReview={data.certificationState === "REQUIRES_OPERATOR_REVIEW"}
              quarantineState={Boolean(latestQuarantine)}
            />
            <RecoverySimulationPanel simulationOutcomes={data.simulationOutcomes} />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <RecoveryStewardshipPanel stewardship={data.stewardship} />
            <RecoveryIntelligencePanel stewardship={data.stewardship} />
            <ContinuityStabilizationPanel stewardship={data.stewardship} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <OperationalStabilityPanel stability={data.operationalStabilityAssessment} />
            <StabilityMetricsPanel stability={data.operationalStabilityAssessment} />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <EscalationCoordinationPanel escalation={data.escalationCoordination} />
            <EscalationLineagePanel escalation={data.escalationCoordination} />
            <EscalationPressureCard stability={data.operationalStabilityAssessment} escalation={data.escalationCoordination} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ContinuityConvergencePanel convergence={data.continuityConvergence} />
            <ConvergenceConfidenceCard convergence={data.continuityConvergence} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <DivergenceDetectionPanel convergence={data.continuityConvergence} />
            <OperationalDriftCard convergence={data.continuityConvergence} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <RecoveryPriorityQueuePanel prioritization={data.recoveryPrioritization} />
            <PrioritizationConfidenceCard prioritization={data.recoveryPrioritization} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <PriorityGovernancePanel prioritization={data.recoveryPrioritization} />
            <RecoveryStarvationCard prioritization={data.recoveryPrioritization} />
          </div>

          <ContinuityTimelinePanel auditHistory={data.auditHistory} />
        </div>
      ) : null}
    </div>
  );
}
