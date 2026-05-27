import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";
import { evaluateRuntimeConstitutionalResilience } from "../resilience/runtimeConstitutionalResilience";
import type { ConstitutionalResilienceAssessment } from "../resilience/resilienceTypes";

export type SupervisoryControlView = {
  runtimeStability: {
    operationalState: string;
    survivabilityScore: number;
    degradationRate: number;
    recoveryPressure: number;
    escalationPressure: number;
    continuityConfidence: number;
    unstableSubsystems: string[];
    stabilizationRequired: boolean;
    timestamp: string;
  };
  recoveryStewardship: {
    supervisedRecoveries: string[];
    blockedRecoveries: string[];
    frozenRecoveryChains: string[];
    disputedOperations: string[];
    activeStabilizationOperations: string[];
    recoveryPriorityOrder: string[];
  };
  escalationGovernance: {
    escalationLineage: string[];
    emergencyEscalations: string[];
    governanceEscalations: string[];
    constitutionalDisputes: string[];
    containmentStatus: string;
  };
  convergence: {
    converged: boolean;
    divergenceScore: number;
    divergenceReasons: string[];
    requiresContainment: boolean;
    requiresEscalation: boolean;
    continuityConfidence: number;
  };
  resilience: ConstitutionalResilienceAssessment;
  generatedAt: string;
};

export function buildSupervisoryControlView(dashboard: RecoveryDashboardReadModel): {
  view: SupervisoryControlView;
  resilience: ReturnType<typeof evaluateRuntimeConstitutionalResilience>;
} {
  const resilience = evaluateRuntimeConstitutionalResilience(dashboard);

  return {
    resilience,
    view: {
      runtimeStability: {
        operationalState: dashboard.operationalStabilityAssessment?.operationalState || "DISPUTED",
        survivabilityScore: dashboard.operationalStabilityAssessment?.survivabilityScore ?? resilience.assessment.survivabilityScore,
        degradationRate: dashboard.operationalStabilityAssessment?.degradationRate ?? resilience.assessment.degradationVelocity,
        recoveryPressure: dashboard.operationalStabilityAssessment?.recoveryPressure ?? 0,
        escalationPressure: dashboard.operationalStabilityAssessment?.escalationPressure ?? resilience.assessment.escalationPressure,
        continuityConfidence: dashboard.operationalStabilityAssessment?.continuityConfidence ?? dashboard.continuityConfidence,
        unstableSubsystems: dashboard.operationalStabilityAssessment?.unstableSubsystems || resilience.assessment.affectedSubsystems,
        stabilizationRequired: dashboard.operationalStabilityAssessment?.stabilizationRequired ?? false,
        timestamp: dashboard.operationalStabilityAssessment?.timestamp || dashboard.generatedAt,
      },
      recoveryStewardship: {
        supervisedRecoveries: dashboard.activeRecoveries.map((entry) => String(entry.executionId || "")).filter(Boolean),
        blockedRecoveries: dashboard.blockedRecoveries.map((entry) => String(entry.executionId || "")).filter(Boolean),
        frozenRecoveryChains: [
          ...(dashboard.stewardship?.shouldFreeze ? [String(dashboard.activeRecoveries[0]?.executionId || "recovery_chain")] : []),
          ...((dashboard.recoveryPrioritization?.assessments || []).filter((assessment) => assessment.state === "FROZEN").map((assessment) => assessment.executionId)),
        ].filter(Boolean),
        disputedOperations: dashboard.governanceDisputes.map((entry) => String(entry.executionId || "")).filter(Boolean),
        activeStabilizationOperations: resilience.stabilization.activeOperations,
        recoveryPriorityOrder: dashboard.recoveryPrioritization?.recoveryQueue || [],
      },
      escalationGovernance: {
        escalationLineage: dashboard.escalationCoordination?.escalationLineageId ? [dashboard.escalationCoordination.escalationLineageId] : [],
        emergencyEscalations: dashboard.escalationCoordination?.escalationType === "emergency" ? [dashboard.escalationCoordination.escalationId] : [],
        governanceEscalations: dashboard.escalationCoordination?.escalationType === "governance" ? [dashboard.escalationCoordination.escalationId] : [],
        constitutionalDisputes: resilience.assessment.disputedConditions,
        containmentStatus: resilience.assessment.requiresContainment ? "CONTAINMENT_REQUIRED" : "CLEAR",
      },
      convergence: {
        converged: dashboard.continuityConvergence?.converged ?? false,
        divergenceScore: dashboard.continuityConvergence?.divergenceScore ?? 1,
        divergenceReasons: dashboard.continuityConvergence?.divergenceReasons || ["convergence_unavailable"],
        requiresContainment: dashboard.continuityConvergence?.requiresContainment ?? resilience.assessment.requiresContainment,
        requiresEscalation: dashboard.continuityConvergence?.requiresEscalation ?? resilience.assessment.requiresEscalation,
        continuityConfidence: dashboard.continuityConvergence?.continuityConfidence ?? dashboard.continuityConfidence,
      },
      resilience: resilience.assessment,
      generatedAt: dashboard.generatedAt,
    },
  };
}
