import { ConstitutionalAuditPanel } from "@/components/governance/ConstitutionalAuditPanel";
import { AutonomousCoordinationPanel } from "@/components/governance/AutonomousCoordinationPanel";
import { ConstitutionalSimulationPanel } from "@/components/governance/ConstitutionalSimulationPanel";
import { ConstitutionalStatusPanel } from "@/components/governance/ConstitutionalStatusPanel";
import { GovernanceIntegrityCard } from "@/components/governance/GovernanceIntegrityCard";
import { SurvivabilityStatePanel } from "@/components/governance/SurvivabilityStatePanel";
import { ContainmentStatusPanel } from "@/components/governance/ContainmentStatusPanel";
import { DegradationModePanel } from "@/components/governance/DegradationModePanel";
import { IsolationBoundaryPanel } from "@/components/governance/IsolationBoundaryPanel";
import { EmergencyStabilizationPanel } from "@/components/governance/EmergencyStabilizationPanel";
import { SovereigntyRiskPanel } from "@/components/governance/SovereigntyRiskPanel";
import { buildConstitutionalOperatorControlPlane } from "@/services/controlPlane/constitutionalOperatorControlPlane";
import { resolveTenantContextFromSessionUser } from "@/services/tenancy/tenantContextResolver";
import { requireSessionUser } from "@/src/lib/auth";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { SectionShell } from "@/src/components/ui/section-shell";

export const dynamic = "force-dynamic";

export default async function GovernanceOperationsPage() {
  const user = await requireSessionUser();
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });

  const tenantContext = resolveTenantContextFromSessionUser({ user });
  const model = await buildConstitutionalOperatorControlPlane({ tenantContext });

  return (
    <div className="space-y-6">
      <SectionShell className="p-6 sm:p-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-sky-200">Governance Operations</p>
          <h2 className="font-display text-3xl font-semibold text-white">Constitutional operator review and simulation control plane</h2>
          <p className="text-sm text-slate-300">Read-dominant operator review for constitutional status, bounded coordination, sovereignty risk, immutable evidence, and deterministic simulation forecasting.</p>
        </div>
      </SectionShell>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <GovernanceIntegrityCard label="Governance Confidence" value={`${Math.round(model.governance.governanceConfidence * 100)}%`} />
        <GovernanceIntegrityCard label="Enforcement State" value={model.enforcement.enforcementState} />
        <GovernanceIntegrityCard label="Review Queue" value={`${model.reviewQueue.length} items`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <ConstitutionalStatusPanel
          constitutionalState={model.governance.constitutionalState}
          governanceIntegrity={model.sovereignty.governanceIntegrity}
          activeRestrictions={model.controlPlaneGovernance.blockedReasons}
          emergencyGovernance={model.governance.constitutionalState === "EMERGENCY_GOVERNANCE"}
          containmentActive={model.enforcement.containmentApplied}
          enforcementState={model.enforcement.enforcementState}
          replayVerificationState={model.dashboard.replayVerificationState}
          disputePresent={model.dashboard.governanceDisputes.length > 0}
          operationalFreeze={model.dashboard.continuityConvergence?.requiresFreeze ?? false}
        />
        <AutonomousCoordinationPanel
          coordinationChains={model.coordination.route}
          supervisedActions={model.coordination.approvedActions}
          deniedActions={model.coordination.deniedActions}
          escalationChains={model.reviewEscalation.escalationChain}
          oversightRequirements={model.coordination.requiredOversight}
          approvalDependencies={model.governance.requiredApprovals}
          coordinationFreezes={model.coordinationReview.blockedReasons}
          containmentRouting={model.enforcement.containmentApplied ? ["containment_required"] : []}
          supervisoryInterventions={model.supervision.stabilizationRecommended ? ["stabilization_recommended"] : []}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <SovereigntyRiskPanel
          sovereigntyState={model.sovereignty.sovereigntyState}
          systemicRisk={model.sovereignty.systemicRisk}
          survivabilityRisk={1 - model.sovereignty.survivabilityConfidence}
          governanceDegradation={1 - model.sovereignty.governanceIntegrity}
          escalationSaturation={model.sovereignty.escalationPressure}
          containmentEffectiveness={model.sovereignty.containmentEffectiveness}
          sovereigntyConfidence={model.sovereignty.survivabilityConfidence}
          unstableDomains={model.sovereignty.unstableDomains}
          emergencyContainmentState={model.sovereignty.sovereigntyState === "EMERGENCY_CONTAINMENT"}
          constitutionalSurvivabilityStatus={model.continuity.continuityTrajectory}
        />
        <ConstitutionalAuditPanel
          evidence={model.evidenceReview.evidenceReferences}
          denialHistory={model.enforcement.blockedReasons}
          enforcementEvents={[model.enforcement.auditRecord.auditRef]}
          disputes={model.disputeReview.unresolvedDisputes}
          emergencyInterventions={model.enforcement.emergencyLockActive ? ["emergency_lock_active"] : []}
          replayMismatches={model.replayReview.blockedReasons}
          escalationLineage={model.reviewEscalation.escalationChain}
          operatorDecisions={model.reviewQueue.map((item) => item.reviewId)}
          freezeEvents={model.coordinationReview.blockedReasons}
          sovereigntyInterventions={model.sovereignty.emergencyControlsRequired ? ["emergency_controls_required"] : []}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <SurvivabilityStatePanel
          survivabilityState={model.survivability.assessment.survivabilityState}
          governanceContinuity={model.survivability.assessment.governanceContinuity}
          auditPreservationConfidence={model.survivability.assessment.auditPreservationConfidence}
          recoverabilityConfidence={model.survivability.assessment.recoverabilityConfidence}
        />
        <ContainmentStatusPanel
          containmentState={model.survivability.containment.containmentState}
          recommendedAction={model.survivability.containment.recommendedAction}
          containmentEffectiveness={model.survivability.containment.containmentEffectiveness}
          containmentRequired={model.survivability.containment.containmentRequired}
          operatorInterventionRequired={model.survivability.containment.operatorInterventionRequired}
        />
        <DegradationModePanel
          degradationMode={model.survivability.degradation.degradationMode}
          autonomyLevel={model.survivability.degradation.autonomyLevel}
          blockedReasons={model.survivability.blockedReasons}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <IsolationBoundaryPanel
          isolatedDomains={model.survivability.containment.isolatedDomains}
          quarantinedDomains={model.survivability.containment.quarantinedDomains}
          degradedDomains={model.survivability.containment.degradedDomains}
        />
        <EmergencyStabilizationPanel
          required={model.survivability.emergencyStabilization.required}
          stabilizationState={model.survivability.emergencyStabilization.stabilizationState}
          bypassAllowed={model.survivability.emergencyStabilization.bypassAllowed}
          blockedReasons={model.survivability.emergencyStabilization.blockedReasons}
        />
      </div>

      <ConstitutionalSimulationPanel simulations={model.simulation.results} />
    </div>
  );
}
