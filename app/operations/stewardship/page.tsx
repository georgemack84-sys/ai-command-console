import { SectionShell } from "@/src/components/ui/section-shell";
import { requireSessionUser } from "@/src/lib/auth";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { resolveTenantContextFromSessionUser } from "@/services/tenancy/tenantContextResolver";
import { buildStewardshipDashboardModel } from "@/services/stewardship/stewardshipDashboardModel";
import { RuntimeStabilityPanel } from "@/components/stewardship/RuntimeStabilityPanel";
import { RecoveryStewardshipPanel } from "@/components/stewardship/RecoveryStewardshipPanel";
import { EscalationGovernancePanel } from "@/components/stewardship/EscalationGovernancePanel";
import { ContinuityConvergenceCard } from "@/components/stewardship/ContinuityConvergenceCard";
import { OperationalRiskMatrix } from "@/components/stewardship/OperationalRiskMatrix";
import { RecoveryForecastingPanel } from "@/components/stewardship/RecoveryForecastingPanel";
import { SimulationIntelligencePanel } from "@/components/stewardship/SimulationIntelligencePanel";
import { ForecastComparisonPanel } from "@/components/stewardship/ForecastComparisonPanel";
import { SimulationConfidenceCard } from "@/components/stewardship/SimulationConfidenceCard";
import { CollapseRiskProjectionCard } from "@/components/stewardship/CollapseRiskProjectionCard";
import { ConstitutionalEnforcementPanel } from "@/components/stewardship/ConstitutionalEnforcementPanel";
import { GovernanceRestrictionCard } from "@/components/stewardship/GovernanceRestrictionCard";
import { RecoveryAuthorizationPanel } from "@/components/stewardship/RecoveryAuthorizationPanel";
import { ConstitutionalConflictPanel } from "@/components/stewardship/ConstitutionalConflictPanel";
import { AutonomousReadinessPanel } from "@/components/stewardship/AutonomousReadinessPanel";
import { ReadinessConfidenceCard } from "@/components/stewardship/ReadinessConfidenceCard";

export const dynamic = "force-dynamic";

export default async function StewardshipOperationsPage() {
  const user = await requireSessionUser();
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });

  const tenantContext = resolveTenantContextFromSessionUser({ user });
  const model = await buildStewardshipDashboardModel({ tenantContext });

  return (
    <div className="space-y-6">
      <SectionShell className="p-6 sm:p-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-sky-200">Supervisory Control</p>
          <h2 className="font-display text-3xl font-semibold text-white">Runtime constitutional resilience dashboard</h2>
          <p className="text-sm text-slate-300">Read-only supervision across runtime stability, recovery stewardship, escalation governance, convergence pressure, and constitutional resilience.</p>
        </div>
      </SectionShell>

      {model.stale ? (
        <SectionShell className="p-4">
          <p className="text-sm text-amber-200">State is stale. The dashboard is failing closed and operator controls remain hidden.</p>
        </SectionShell>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <RuntimeStabilityPanel runtimeStability={model.view.runtimeStability} resilienceState={model.view.resilience.resilienceState} />
        <RecoveryStewardshipPanel recoveryStewardship={model.view.recoveryStewardship} resilience={model.view.resilience} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <EscalationGovernancePanel escalationGovernance={model.view.escalationGovernance} frozen={model.view.resilience.requiresFreeze} />
        <ContinuityConvergenceCard convergence={model.view.convergence} />
        <OperationalRiskMatrix prioritization={model.sourceDashboard.recoveryPrioritization} resilience={model.view.resilience} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <RecoveryForecastingPanel forecasting={model.forecasting} />
        <SimulationIntelligencePanel forecasting={model.forecasting} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <ForecastComparisonPanel forecasting={model.forecasting} />
        <SimulationConfidenceCard forecasting={model.forecasting} />
        <CollapseRiskProjectionCard forecasting={model.forecasting} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <ConstitutionalEnforcementPanel decision={model.decision} />
        <GovernanceRestrictionCard decision={model.decision} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <RecoveryAuthorizationPanel decision={model.decision} />
        <ConstitutionalConflictPanel decision={model.decision} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <AutonomousReadinessPanel readiness={model.readiness} />
        <ReadinessConfidenceCard readiness={model.readiness} />
      </div>
    </div>
  );
}
