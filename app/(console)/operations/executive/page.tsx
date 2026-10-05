import { ConstitutionalFreezeBanner } from "@/components/executive/ConstitutionalFreezeBanner";
import { ConstitutionalOperationsPanel } from "@/components/executive/ConstitutionalOperationsPanel";
import { StrategicContinuityPanel } from "@/components/executive/StrategicContinuityPanel";
import { AutonomousSupervisionPanel } from "@/components/executive/AutonomousSupervisionPanel";
import { ContainmentPanel } from "@/components/executive/ContainmentPanel";
import { OperationalSurvivabilityCard } from "@/components/executive/OperationalSurvivabilityCard";
import { GovernancePressureMatrix } from "@/components/executive/GovernancePressureMatrix";
import { SurvivabilityForecastChart } from "@/components/executive/SurvivabilityForecastChart";
import { StrategicThreatMonitor } from "@/components/executive/StrategicThreatMonitor";
import { OperationalIntegrityGauge } from "@/components/executive/OperationalIntegrityGauge";
import { ContinuityProjectionPanel } from "@/components/executive/ContinuityProjectionPanel";
import { ContainmentTopologyView } from "@/components/executive/ContainmentTopologyView";
import { AutonomyRestrictionTable } from "@/components/executive/AutonomyRestrictionTable";
import { ExecutiveEscalationTimeline } from "@/components/executive/ExecutiveEscalationTimeline";
import { RecoveryPressureHeatmap } from "@/components/executive/RecoveryPressureHeatmap";
import { SystemicRiskMatrix } from "@/components/executive/SystemicRiskMatrix";
import { buildExecutiveOperationsAggregator } from "@/services/executive/executiveOperationsAggregator";
import { resolveTenantContextFromSessionUser } from "@/services/tenancy/tenantContextResolver";
import { requireSessionUser } from "@/src/lib/auth";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { SectionShell } from "@/src/components/ui/section-shell";

export const dynamic = "force-dynamic";

export default async function ExecutiveOperationsPage() {
  const user = await requireSessionUser();
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });

  const tenantContext = resolveTenantContextFromSessionUser({ user });
  const model = await buildExecutiveOperationsAggregator({
    tenantContext,
    operatorId: user.id,
  });

  return (
    <div className="space-y-6">
      <SectionShell className="p-6 sm:p-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-sky-200">Executive Operations</p>
          <h2 className="font-display text-3xl font-semibold text-white">Executive constitutional operations dashboard</h2>
          <p className="text-sm text-slate-300">Strategic survivability visibility, governance pressure analysis, containment topology, and bounded autonomy supervision across constitutional operations.</p>
        </div>
      </SectionShell>

      <ConstitutionalFreezeBanner
        visible={model.escalation.constitutionalFreezeVisible}
        reasons={model.constraints.blockedReasons}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <OperationalSurvivabilityCard survivability={model.survivabilityCard} />
        <OperationalIntegrityGauge
          constitutionalStability={model.governancePressure.constitutionalStability}
          governanceIntegrity={model.governancePressure.governanceIntegrity}
        />
        <StrategicThreatMonitor
          threatLevel={model.survivabilityCard.strategicThreatLevel}
          unstableDomains={model.controlPlane.survivability.containment.isolatedDomains}
          uncertaintyLevel={model.strategicForecast.uncertaintyLevel}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <ConstitutionalOperationsPanel
          constitutionalState={model.controlPlane.governance.constitutionalState}
          governancePressure={model.governancePressure}
          survivability={model.survivabilityCard}
          activeDisputes={model.controlPlane.disputeReview.unresolvedDisputes}
          containmentAction={model.controlPlane.survivability.containment.recommendedAction}
          approvalBacklog={model.controlPlane.dashboard.pendingApprovals.length}
          governanceDegradation={1 - model.controlPlane.sovereignty.governanceIntegrity}
          freezeVisible={model.escalation.constitutionalFreezeVisible}
        />
        <StrategicContinuityPanel
          forecast={model.strategicForecast}
          continuityViability={model.controlPlane.continuity.survivabilityScore}
          recoveryCapacity={model.controlPlane.survivability.assessment.recoverabilityConfidence}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <AutonomousSupervisionPanel
          supervisionState={model.controlPlane.supervision.supervisionState}
          boundedAutonomyStatus={model.controlPlane.survivability.degradation.autonomyLevel}
          blockedAutonomyActions={model.controlPlane.coordination.deniedActions}
          disputedAutonomyDecisions={model.controlPlane.disputeReview.unresolvedDisputes}
          operatorInterventions={model.controlPlane.coordination.requiredOversight}
          supervisionEscalations={model.controlPlane.reviewEscalation.escalationChain}
          governanceOverrides={model.constraints.blockedReasons}
          emergencyAutonomyFreeze={model.escalation.emergencyAutonomyFreeze}
        />
        <ContainmentPanel
          containmentState={model.controlPlane.survivability.containment.containmentState}
          isolatedSystems={model.controlPlane.survivability.containment.isolatedDomains}
          continuityProtection={model.controlPlane.survivability.protocols.protocols}
          frozenOperations={model.controlPlane.survivability.blockedReasons}
          survivabilityProtocols={model.controlPlane.survivability.protocols.protocols}
          emergencyContainment={model.controlPlane.survivability.emergencyStabilization.required}
          runtimePartitions={model.controlPlane.survivability.containment.quarantinedDomains}
          degradedOperationalZones={model.controlPlane.survivability.containment.degradedDomains}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <GovernancePressureMatrix matrix={model.governancePressure} />
        <ExecutiveEscalationTimeline
          escalationTimeline={model.escalation.escalationTimeline}
          escalationSaturation={model.escalation.escalationSaturation}
        />
        <AutonomyRestrictionTable
          deniedActions={model.controlPlane.coordination.deniedActions}
          requiredOversight={model.controlPlane.coordination.requiredOversight}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <SurvivabilityForecastChart forecast={model.strategicForecast} />
        <ContinuityProjectionPanel forecast={model.strategicForecast} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <ContainmentTopologyView
          isolatedDomains={model.controlPlane.survivability.containment.isolatedDomains}
          quarantinedDomains={model.controlPlane.survivability.containment.quarantinedDomains}
          degradedDomains={model.controlPlane.survivability.containment.degradedDomains}
        />
        <RecoveryPressureHeatmap matrix={model.governancePressure} />
        <SystemicRiskMatrix
          systemicRisk={model.controlPlane.survivability.assessment.systemicInstability}
          collapseProbability={model.strategicForecast.collapseRisk}
          containmentLoad={model.strategicForecast.projectedContainmentLoad}
          governanceStress={model.strategicForecast.governanceStressProjection}
        />
      </div>
    </div>
  );
}
