import { SectionShell } from "@/src/components/ui/section-shell";
import { requireSessionUser } from "@/src/lib/auth";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { resolveTenantContextFromSessionUser } from "@/services/tenancy/tenantContextResolver";
import { buildExecutiveOperationsAggregator } from "@/services/executive/executiveOperationsAggregator";
import { buildConstitutionalResilienceEngine } from "@/services/resilience/constitutionalResilienceEngine";
import { evaluateConstitutionalReadiness } from "@/services/readiness/constitutionalReadiness";
import { ConstitutionalIntegrityPanel } from "@/components/resilience/ConstitutionalIntegrityPanel";
import { ReadinessValidationPanel } from "@/components/resilience/ReadinessValidationPanel";
import { SurvivabilityRiskPanel } from "@/components/resilience/SurvivabilityRiskPanel";
import { ProtectedSystemsPanel } from "@/components/resilience/ProtectedSystemsPanel";
import { EmergencyContinuityPanel } from "@/components/resilience/EmergencyContinuityPanel";
import { ResilienceStatusCard } from "@/components/resilience/ResilienceStatusCard";
import { ContinuityModeCard } from "@/components/resilience/ContinuityModeCard";
import { ReadinessConfidenceCard } from "@/components/resilience/ReadinessConfidenceCard";
import { CollapsePreventionTimeline } from "@/components/resilience/CollapsePreventionTimeline";
import { ReadinessDriftPanel } from "@/components/resilience/ReadinessDriftPanel";
import { ConfidenceLineagePanel } from "@/components/resilience/ConfidenceLineagePanel";
import { DependencyGraphPanel } from "@/components/resilience/DependencyGraphPanel";

export const dynamic = "force-dynamic";

export default async function ResilienceOperationsPage() {
  const user = await requireSessionUser();
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });

  const tenantContext = resolveTenantContextFromSessionUser({ user });
  const executive = await buildExecutiveOperationsAggregator({
    tenantContext,
    operatorId: user.id,
  });
  const nowMs = executive.strategicForecast.generatedAt;
  const resilience = buildConstitutionalResilienceEngine({
    executiveModel: executive,
    nowMs,
  });
  const readiness = evaluateConstitutionalReadiness({
    resilience,
    executive,
    nowMs,
  });
  const dependencyTrace = readiness.dependencyGraph.trace("Governance", "Readiness");

  return (
    <div className="space-y-6">
      <SectionShell className="p-6 sm:p-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-sky-200">Resilience Operations</p>
          <h2 className="font-display text-3xl font-semibold text-white">Constitutional resilience, continuity and readiness architecture</h2>
          <p className="text-sm text-slate-300">Constitutional survivability assurance, advisory-only readiness scoring, continuity preservation, and immutable confidence lineage across governed operations.</p>
        </div>
      </SectionShell>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <ResilienceStatusCard
          resilienceState={resilience.assessment.resilienceState}
          constitutionalIntegrity={resilience.assessment.constitutionalIntegrity}
          survivabilityConfidence={resilience.assessment.recoverabilityConfidence}
        />
        <ContinuityModeCard
          continuityMode={resilience.continuity.mode}
          continuityPreserved={resilience.continuity.continuityPreserved}
          isolatedDomains={resilience.continuity.isolatedDomains}
        />
        <ReadinessConfidenceCard
          readinessState={readiness.assessment.readinessState}
          readinessConfidence={readiness.assessment.readinessConfidence}
          constitutionalSafe={readiness.assessment.constitutionalSafe}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <ConstitutionalIntegrityPanel
          constitutionalIntegrity={resilience.assessment.constitutionalIntegrity}
          governanceContinuity={resilience.assessment.governanceContinuity}
          survivabilityConfidence={resilience.assessment.recoverabilityConfidence}
          continuityStatus={resilience.continuity.mode}
          operationalStability={resilience.assessment.operationalViability}
        />
        <ReadinessValidationPanel
          readinessConfidence={readiness.assessment.readinessConfidence}
          readinessState={readiness.assessment.readinessState}
          governanceReliability={readiness.assessment.governanceReliability}
          enforcementConsistency={readiness.assessment.enforcementConsistency}
          operatorReviewRequirements={readiness.assessment.requiredOperatorActions}
          blockedReadinessDomains={readiness.assessment.blockingRisks}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <SurvivabilityRiskPanel
          collapseProbability={executive.survivabilityCard.collapseProbability}
          escalationPressure={resilience.assessment.escalationPressure}
          recoverySaturation={1 - resilience.assessment.recoverabilityConfidence}
          containmentPressure={executive.governancePressure.containmentPressure}
          instabilityVelocity={resilience.assessment.systemicInstability}
        />
        <ProtectedSystemsPanel
          protectedOperationalDomains={resilience.protectedOperations.protectedDomains}
          frozenSystems={resilience.protectedOperations.frozenSystems}
          isolatedSystems={resilience.protectedOperations.isolatedSystems}
          continuityPreservedSystems={resilience.protectedOperations.continuityPreservedSystems}
          governanceProtectedSystems={resilience.protectedOperations.governanceProtectedSystems}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <EmergencyContinuityPanel
          emergencyContinuityOperations={resilience.emergencyContinuity.recommendedActions}
          survivabilityProtocols={resilience.protocols.protocols}
          stabilizationRouting={resilience.continuity.mode}
          containmentEscalation={resilience.collapsePrevention.escalationActions}
          operatorInterventionRequirements={readiness.review.recommendedActions}
        />
        <CollapsePreventionTimeline
          collapseRisk={resilience.collapsePrevention.collapseRisk}
          containmentActions={resilience.collapsePrevention.containmentActions}
          escalationActions={resilience.collapsePrevention.escalationActions}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <ReadinessDriftPanel drifts={readiness.drifts} />
        <ConfidenceLineagePanel lineage={readiness.confidenceLineage} />
      </div>

      <DependencyGraphPanel
        nodes={readiness.dependencyGraph.nodes}
        trace={dependencyTrace}
      />
    </div>
  );
}
