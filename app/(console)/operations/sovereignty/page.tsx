import { SectionShell } from "@/src/components/ui/section-shell";
import { requireSessionUser } from "@/src/lib/auth";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { resolveTenantContextFromSessionUser } from "@/services/tenancy/tenantContextResolver";
import { buildExecutiveOperationsAggregator } from "@/services/executive/executiveOperationsAggregator";
import { buildConstitutionalResilienceEngine } from "@/services/resilience/constitutionalResilienceEngine";
import { evaluateConstitutionalReadiness } from "@/services/readiness/constitutionalReadiness";
import { buildConstitutionalSovereigntyEngine } from "@/services/sovereignty/constitutionalSovereigntyEngine";
import { validateConstitutionalOperation } from "@/services/validation/constitutionalOperationalValidation";
import { buildCivilizationGovernance } from "@/services/civilization/civilizationGovernance";
import { buildCivilizationContinuity } from "@/services/civilization/civilizationContinuity";
import { buildCivilizationContainment } from "@/services/civilization/civilizationContainment";
import { buildCivilizationRiskAssessment } from "@/services/civilization/civilizationRiskAssessment";
import { buildSovereigntySimulation } from "@/services/simulation/sovereigntySimulation";
import { SovereigntyStatusPanel } from "@/components/sovereignty/SovereigntyStatusPanel";
import { CivilizationContinuityPanel } from "@/components/sovereignty/CivilizationContinuityPanel";
import { AutonomousGovernancePanel } from "@/components/sovereignty/AutonomousGovernancePanel";
import { ConstitutionalContainmentPanel } from "@/components/sovereignty/ConstitutionalContainmentPanel";
import { ConstitutionalValidationPanel } from "@/components/sovereignty/ConstitutionalValidationPanel";
import { SovereigntyRiskPanel } from "@/components/sovereignty/SovereigntyRiskPanel";
import { ChaosValidationPanel } from "@/components/sovereignty/ChaosValidationPanel";
import { OperationalIntegrityCard } from "@/components/sovereignty/OperationalIntegrityCard";
import { ContainmentPressureCard } from "@/components/sovereignty/ContainmentPressureCard";
import { SurvivabilityConfidenceCard } from "@/components/sovereignty/SurvivabilityConfidenceCard";
import { CivilizationRiskTimeline } from "@/components/sovereignty/CivilizationRiskTimeline";

export const dynamic = "force-dynamic";

export default async function SovereigntyOperationsPage() {
  const user = await requireSessionUser();
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });

  const tenantContext = resolveTenantContextFromSessionUser({ user });
  const executive = await buildExecutiveOperationsAggregator({
    tenantContext,
    operatorId: user.id,
  });
  const nowMs = executive.strategicForecast.generatedAt;
  const resilience = buildConstitutionalResilienceEngine({ executiveModel: executive, nowMs });
  const readiness = evaluateConstitutionalReadiness({ resilience, executive, nowMs });
  const sovereignty = buildConstitutionalSovereigntyEngine({ executive, resilience, readiness, nowMs });
  const validation = validateConstitutionalOperation({
    sovereigntyState: sovereignty.assessment.sovereigntyState,
    constitutionalIntegrity: sovereignty.assessment.constitutionalIntegrity,
    governanceReliability: sovereignty.assessment.governanceReliability,
    containmentIntegrity: 1 - sovereignty.assessment.containmentPressure,
    operationalStability: sovereignty.assessment.operationalStability,
    immutableAuditVerified: sovereignty.assessment.immutableAuditHealthy,
    autonomyRisk: sovereignty.assessment.autonomyRisk,
    disputedSystems: sovereignty.assessment.unstableSystems,
    createdAt: nowMs,
  });
  const civilization = buildCivilizationGovernance({
    sovereigntyState: sovereignty.assessment.sovereigntyState,
    validationState: validation.validationState,
    containmentRequired: validation.containmentRequired,
    operatorInterventionRequired: sovereignty.assessment.operatorInterventionRequired,
    blockedReasons: sovereignty.enforcement.requiredActions,
    createdAt: nowMs,
  });
  const simulation = buildSovereigntySimulation({
    sovereigntyState: sovereignty.assessment.sovereigntyState,
    survivabilityConfidence: sovereignty.assessment.survivabilityConfidence,
    governanceReliability: sovereignty.assessment.governanceReliability,
    operationalStability: sovereignty.assessment.operationalStability,
    escalationPressure: sovereignty.assessment.escalationPressure,
    containmentPressure: sovereignty.assessment.containmentPressure,
    systemicRisk: sovereignty.assessment.systemicRisk,
    unstableSystems: sovereignty.assessment.unstableSystems,
    createdAt: nowMs,
  });
  const continuity = buildCivilizationContinuity({
    survivabilityConfidence: sovereignty.assessment.survivabilityConfidence,
    continuityProjection: simulation.forecast.survivabilityProjection,
    isolatedSystems: sovereignty.assessment.unstableSystems,
    protectedDomains: sovereignty.assessment.unstableSystems.length
      ? ["governance", "audit", "containment"]
      : ["governance", "audit", "containment", "coordination"],
    createdAt: nowMs,
  });
  const containment = buildCivilizationContainment({
    inheritedContainmentState: sovereignty.assessment.sovereigntyState,
    containmentPressure: sovereignty.assessment.containmentPressure,
    isolatedSystems: sovereignty.assessment.unstableSystems,
    frozenSystems: sovereignty.assessment.frozenSystems,
    createdAt: nowMs,
  });
  const risk = buildCivilizationRiskAssessment({
    systemicRisk: sovereignty.assessment.systemicRisk,
    survivabilityConfidence: sovereignty.assessment.survivabilityConfidence,
    autonomyRisk: sovereignty.assessment.autonomyRisk,
    operationalStability: sovereignty.assessment.operationalStability,
  });

  return (
    <div className="space-y-6">
      <SectionShell className="p-6 sm:p-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-sky-200">Sovereignty Operations</p>
          <h2 className="font-display text-3xl font-semibold text-white">Constitutional sovereignty, operational validation and bounded civilization governance</h2>
          <p className="text-sm text-slate-300">Inherited readiness, resilience, containment and governance signals composed into a display-only sovereignty surface with deterministic validation, immutable lineage, and blocked autonomy visibility.</p>
        </div>
      </SectionShell>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <OperationalIntegrityCard
          constitutionalIntegrity={sovereignty.assessment.constitutionalIntegrity}
          governanceReliability={sovereignty.assessment.governanceReliability}
          operationalStability={sovereignty.assessment.operationalStability}
        />
        <ContainmentPressureCard
          containmentPressure={sovereignty.assessment.containmentPressure}
          escalationPressure={sovereignty.assessment.escalationPressure}
          blockedAutonomy={sovereignty.enforcement.requiredActions}
        />
        <SurvivabilityConfidenceCard
          survivabilityConfidence={sovereignty.assessment.survivabilityConfidence}
          systemicRisk={sovereignty.assessment.systemicRisk}
          civilizationScaleRisk={sovereignty.assessment.civilizationScaleRisk}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <SovereigntyStatusPanel
          sovereigntyState={sovereignty.assessment.sovereigntyState}
          constitutionalSafe={sovereignty.assessment.constitutionalSafe}
          immutableAuditHealthy={sovereignty.assessment.immutableAuditHealthy}
          unstableSystems={sovereignty.assessment.unstableSystems}
          frozenSystems={sovereignty.assessment.frozenSystems}
        />
        <ConstitutionalValidationPanel
          validationState={validation.validationState}
          severity={validation.severity}
          failures={validation.failures}
          warnings={validation.warnings}
          immutableAuditVerified={validation.immutableAuditVerified}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <CivilizationContinuityPanel
          continuityState={continuity.continuityState}
          continuityProjection={continuity.continuityProjection}
          protectedDomains={continuity.protectedDomains}
          isolatedDomains={continuity.isolatedSystems}
        />
        <ConstitutionalContainmentPanel
          containmentRequired={validation.containmentRequired}
          containmentState={containment.containmentState}
          frozenSystems={containment.frozenSystems}
          disputedSystems={validation.disputedSystems}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <AutonomousGovernancePanel
          operatorSupremacyPreserved={civilization.operatorSupremacyPreserved}
          blockedAutonomy={sovereignty.enforcement.requiredActions}
          supervisionState={sovereignty.assessment.operatorInterventionRequired ? "SUPERVISED" : "GOVERNED"}
          operatorInterventionRequired={sovereignty.assessment.operatorInterventionRequired}
        />
        <SovereigntyRiskPanel
          autonomyRisk={sovereignty.assessment.autonomyRisk}
          systemicRisk={risk.systemicRisk}
          civilizationScaleRisk={risk.civilizationScaleRisk}
          inheritedReadinessConstraints={readiness.assessment.blockingRisks}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <ChaosValidationPanel
          disputedSystems={validation.disputedSystems}
          rollbackRequired={validation.rollbackRequired}
          containmentRequired={validation.containmentRequired}
          escalationRequired={validation.escalationRequired}
        />
        <CivilizationRiskTimeline
          collapseRisk={simulation.forecast.collapseRisk}
          governanceStressProjection={simulation.forecast.governanceStressProjection}
          projectedContainmentLoad={simulation.forecast.projectedContainmentLoad}
          uncertaintyLevel={simulation.forecast.uncertaintyLevel}
        />
      </div>
    </div>
  );
}
