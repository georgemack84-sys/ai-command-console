import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";
import type { SupervisoryControlView } from "../stewardship/supervisoryControlView";

export type RecoverySimulationType =
  | "REPLAY"
  | "ROLLBACK"
  | "ESCALATION"
  | "REASSIGNMENT"
  | "CONTAINMENT"
  | "CONTINUITY_STABILIZATION"
  | "DEGRADATION_PROPAGATION";

export type RecoveryProjectedOutcome =
  | "SUCCESS"
  | "PARTIAL_SUCCESS"
  | "UNSTABLE"
  | "CONTAINMENT_REQUIRED"
  | "ESCALATION_REQUIRED"
  | "FAILURE"
  | "COLLAPSE_RISK";

export type ForecastUncertaintyLevel =
  | "LOW"
  | "MODERATE"
  | "HIGH"
  | "SEVERE";

export type RecoverySimulationResult = {
  simulationId: string;
  simulationType: RecoverySimulationType;
  projectedOutcome: RecoveryProjectedOutcome;
  survivabilityScore: number;
  continuityConfidence: number;
  escalationProbability: number;
  operationalTrustProjection: number;
  projectedSubsystemFailures: string[];
  projectedEscalations: string[];
  confidenceScore: number;
  uncertaintyLevel: ForecastUncertaintyLevel;
  forecastLineage: string[];
  evidenceSources: string[];
  generatedAt: string;
};

export type SimulationScenario = {
  simulationType: RecoverySimulationType;
  executionIds: string[];
  frozen: boolean;
  disputed: boolean;
  evidenceSources: string[];
};

export type SimulationForecastSummary = {
  advisoryOnly: true;
  simulations: RecoverySimulationResult[];
  confidenceDegradationReasons: string[];
  evidenceSufficient: boolean;
  collapseRisk: number;
  containmentPressure: number;
  governanceInstabilityRisk: number;
  operationalTrustProjection: number;
  generatedAt: string;
};

export type SimulationAuditRecord = {
  eventType: string;
  simulationId?: string;
  evidence: string[];
  details: string[];
  timestamp: string;
};

export type SimulationThresholds = {
  severeRiskThreshold: number;
  degradedConfidenceThreshold: number;
  severeUncertaintyThreshold: number;
};

export type SimulationInput = {
  dashboard: RecoveryDashboardReadModel;
  supervisoryView?: SupervisoryControlView;
  nowMs?: number;
};
