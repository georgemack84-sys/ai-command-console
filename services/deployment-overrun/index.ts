export { evaluateDeploymentOverrun } from "./deploymentOverrunEngine";
export {
  calculateDeploymentTimeSignals,
  classifyDeploymentFailure,
  deriveDeploymentOverrunState,
  isDeploymentActive,
} from "./deploymentOverrunClassifier";
export {
  buildDeploymentOverrunEvidence,
  hashDeploymentOverrunEvidence,
  verifyDeploymentOverrunReplayEvidence,
} from "./deploymentOverrunEvidence";
export {
  buildContainmentDecision,
  buildOperatorActionPolicy,
} from "./deploymentOverrunContainment";
export { buildDeploymentOverrunTelemetry } from "./deploymentOverrunTelemetry";
export { adaptDeploymentOverrunToAdvisory } from "./deploymentOverrunAdvisoryAdapter";
export type {
  ActiveDeploymentEvidence,
  DeploymentArtifactEvidence,
  DeploymentCertificationEvidence,
  DeploymentContainmentDecision,
  DeploymentFailureClassification,
  DeploymentLogEvidence,
  DeploymentOperatorAction,
  DeploymentOperatorActionPolicy,
  DeploymentOverrunEvaluation,
  DeploymentOverrunEvidence,
  DeploymentOverrunReplayVerification,
  DeploymentOverrunSnapshot,
  DeploymentOverrunState,
  DeploymentOverrunTelemetry,
  DeploymentReplayEvidence,
} from "./types";
export type {
  DeploymentOverrunAdvisoryInput,
  DeploymentOverrunAdvisoryResult,
  OverrunAdvisoryStatus,
  OverrunRisk,
} from "./deploymentOverrunAdvisoryAdapter";
