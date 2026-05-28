import type { AutonomyLevel, ConstitutionalSnapshotEnvelope } from "@/types/deterministic-snapshot-engine";
import type { MissionConsoleError } from "./errors";

export type MissionConsolePanelState = "READY" | "DISPUTED" | "UNAVAILABLE";

export type MissionConsoleDomain =
  | "timeline"
  | "replay"
  | "drift"
  | "governance"
  | "snapshots"
  | "dependencies"
  | "simulation"
  | "recovery"
  | "approvals";

export type MissionConsoleSourceAuthority =
  | "4.3O.execution-treaty"
  | "4.4A.validation-core"
  | "4.4B.step-trace-viewer"
  | "4.4C.policy-decision-explainer"
  | "4.4D.plan-diff-inspector"
  | "4.4E.replay-reconstruction-engine"
  | "4.4F.deterministic-snapshot-engine"
  | "control-plane.review"
  | "control-plane.approval"
  | "control-plane.simulation"
  | "console.operator-recovery";

export type MissionConsoleEvidenceLink = Readonly<{
  label: string;
  authority: MissionConsoleSourceAuthority;
  hash?: string;
  ref?: string;
  missing?: boolean;
}>;

export type MissionConsoleDispute = Readonly<{
  domain: MissionConsoleDomain;
  state: "DISPUTED";
  reason: string;
  authority: MissionConsoleSourceAuthority;
  evidenceLinks: readonly MissionConsoleEvidenceLink[];
}>;

export type MissionConsoleTimelineEntry = Readonly<{
  eventId: string;
  sequence: number;
  timestamp: string;
  eventType: string;
  authority: MissionConsoleSourceAuthority;
  validator?: string;
  parentEventId?: string;
  rootEventId?: string;
  state: MissionConsolePanelState;
  evidenceLinks: readonly MissionConsoleEvidenceLink[];
  errorCodes: readonly string[];
}>;

export type MissionConsoleDependencyNode = Readonly<{
  nodeId: string;
  label: string;
  state: MissionConsolePanelState;
  authority: MissionConsoleSourceAuthority;
}>;

export type MissionConsoleDependencyEdge = Readonly<{
  from: string;
  to: string;
  authority: MissionConsoleSourceAuthority;
  disputed: boolean;
}>;

export type MissionConsoleGovernanceIntervention = Readonly<{
  interventionId: string;
  label: string;
  authority: MissionConsoleSourceAuthority;
  delegated: true;
  route: string;
  blockedReasons: readonly string[];
}>;

export type MissionConsoleOperatorAction = Readonly<{
  actionId: string;
  label: string;
  delegated: true;
  route: string;
  method: "GET" | "POST";
  requestOnly: boolean;
  blocked: boolean;
  blockedReasons: readonly string[];
  authority: MissionConsoleSourceAuthority;
}>;

export type MissionConsoleReadinessState = Readonly<{
  state: MissionConsolePanelState;
  summary: string;
  evidenceLinks: readonly MissionConsoleEvidenceLink[];
}>;

export type MissionConsoleAutonomyIndicators = Readonly<{
  visibilityOnly: true;
  autonomyLevel: AutonomyLevel;
  confidenceLabel: "low" | "medium" | "high";
  escalationVisible: boolean;
  simulationVisible: boolean;
  governanceInterventionVisible: boolean;
  approvalVisible: boolean;
  recoveryVisible: boolean;
  constitutionalRule: "NO_AUTONOMOUS_DECISION_MAY_BYPASS_GOVERNANCE";
}>;

export type MissionConsoleDomainView<T> = Readonly<{
  domain: MissionConsoleDomain;
  state: MissionConsolePanelState;
  authority: readonly MissionConsoleSourceAuthority[];
  evidenceLinks: readonly MissionConsoleEvidenceLink[];
  disputes: readonly MissionConsoleDispute[];
  data: T;
}>;

export type MissionConsoleView = Readonly<{
  viewId: string;
  missionId: string;
  executionId: string;
  generatedAt: string;
  consoleHash: string;
  sourceAuthorities: readonly MissionConsoleSourceAuthority[];
  state: MissionConsolePanelState;
  readiness: MissionConsoleReadinessState;
  autonomy: MissionConsoleAutonomyIndicators;
  interventions: readonly MissionConsoleGovernanceIntervention[];
  operatorActions: readonly MissionConsoleOperatorAction[];
  timeline: MissionConsoleDomainView<{
    entries: readonly MissionConsoleTimelineEntry[];
  }>;
  replay: MissionConsoleDomainView<{
    replayId: string;
    replayState: string;
    reconstructionHash: string;
    integrityValid: boolean;
    driftTypes: readonly string[];
    branchVisible: boolean;
    comparisonSummary: readonly string[];
  }>;
  drift: MissionConsoleDomainView<{
    result: string;
    driftClass: string;
    changedPaths: readonly string[];
    replayValid: boolean;
    hashMismatch: boolean;
  }>;
  governance: MissionConsoleDomainView<{
    finalDecision: string;
    denialReasons: readonly string[];
    enforcementChain: readonly string[];
    interventionPoints: readonly string[];
    constitutionalConstraints: readonly string[];
  }>;
  snapshots: MissionConsoleDomainView<{
    snapshots: readonly ConstitutionalSnapshotEnvelope[];
  }>;
  dependencies: MissionConsoleDomainView<{
    nodes: readonly MissionConsoleDependencyNode[];
    edges: readonly MissionConsoleDependencyEdge[];
    unresolvedDependencies: readonly string[];
    cycleDetected: boolean;
  }>;
  simulation: MissionConsoleDomainView<{
    readOnly: true;
    branchOutcomes: readonly string[];
    rollbackSimulationVisible: boolean;
    escalationSimulationVisible: boolean;
    governanceSimulationVisible: boolean;
  }>;
  recovery: MissionConsoleDomainView<{
    readiness: string;
    rollbackLineage: readonly string[];
    containmentState: string;
    approvalRequirements: readonly string[];
    blockedReasons: readonly string[];
    risk: string;
  }>;
  approvals: MissionConsoleDomainView<{
    approvalChain: readonly string[];
    pendingReviews: readonly string[];
    signedApprovals: readonly string[];
    revokedApprovals: readonly string[];
    escalationRoutes: readonly string[];
    overrideConstraints: readonly string[];
    operatorActionHistory: readonly string[];
  }>;
  warnings: readonly string[];
  errors: readonly MissionConsoleError[];
}>;

export type MissionConsoleBuildInput = Readonly<{
  missionId: string;
  executionId: string;
  generatedAt: string;
  treaty: import("@/types/execution-treaty").ExecutionTreatyPackage;
  validation: import("@/services/validation-core").ValidationPipelineOutput;
  traceView: import("@/types/step-trace-viewer").StepTraceView;
  policyExplanation: import("@/types/policy-decision-explainer").PolicyDecisionExplanation;
  diffInspection: import("@/types/plan-diff-inspector").PlanDiffInspectionResult;
  replay: import("@/types/replay-reconstruction-engine").ReplayReconstructionResult;
  snapshots: readonly ConstitutionalSnapshotEnvelope[];
}>;
