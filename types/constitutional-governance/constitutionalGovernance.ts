import type { AutonomyLevel, ConstitutionalSnapshotEnvelope } from "@/types/deterministic-snapshot-engine";
import type { MissionConsoleEvidenceLink, MissionConsoleSourceAuthority, MissionConsoleView } from "@/types/mission-intelligence-console";
import type { PolicyDecisionExplanation } from "@/types/policy-decision-explainer";
import type { ReplayReconstructionResult } from "@/types/replay-reconstruction-engine";
import type { StepTraceView } from "@/types/step-trace-viewer";
import type { ExecutionTreatyPackage } from "@/types/execution-treaty";
import type { ValidationPipelineOutput } from "@/services/validation-core";
import type { PlanDiffInspectionResult } from "@/types/plan-diff-inspector";
import type { ConstitutionalGovernanceError } from "./errors";

export type ConstitutionalDecision = "ALLOW" | "DENY" | "ESCALATE";

export type ConstitutionalGovernanceScope =
  | "replay"
  | "snapshot"
  | "simulation"
  | "recovery"
  | "escalation"
  | "autonomy"
  | "forensics"
  | "branch";

export type ConstitutionalPolicy = Readonly<{
  policyId: string;
  treatyId: string;
  policySnapshotHash: string;
  governanceLineageHash: string;
  approvalLineageHash: string;
  authorityLineageHash: string;
  failClosed: true;
  unknownAuthorityDisposition: "DENY";
  rules: readonly string[];
}>;

export type AuthorityBoundary = Readonly<{
  authorityId: string;
  authorityClass: ConstitutionalGovernanceScope;
  sourceAuthority: MissionConsoleSourceAuthority;
  allowedScopes: readonly string[];
  deniedOperations: readonly string[];
  requiresApproval: boolean;
  immutable: true;
  lineageHash: string;
}>;

export type ReplayAuthority = Readonly<{
  decision: ConstitutionalDecision;
  lineageValid: boolean;
  allowedOperations: readonly string[];
  deniedOperations: readonly string[];
  replaySnapshotHash: string;
  replayLineageHash: string;
  evidenceLinks: readonly MissionConsoleEvidenceLink[];
}>;

export type SnapshotAccessGrant = Readonly<{
  decision: ConstitutionalDecision;
  visibleSnapshotIds: readonly string[];
  branchAuthorityValid: boolean;
  forensicVisibility: "VISIBLE" | "DENIED" | "DISPUTED";
  evidenceLinks: readonly MissionConsoleEvidenceLink[];
}>;

export type SimulationScope = Readonly<{
  decision: ConstitutionalDecision;
  readOnly: true;
  branchSimulationVisible: boolean;
  alternateOutcomeVisible: boolean;
  deniedOperations: readonly string[];
  evidenceLinks: readonly MissionConsoleEvidenceLink[];
}>;

export type RecoveryAuthorization = Readonly<{
  decision: ConstitutionalDecision;
  approvalRequired: true;
  blastRadius: "bounded" | "high" | "unknown";
  lineageValid: boolean;
  blockedReasons: readonly string[];
  evidenceLinks: readonly MissionConsoleEvidenceLink[];
}>;

export type EscalationAuthority = Readonly<{
  decision: ConstitutionalDecision;
  pauseAuthority: boolean;
  overrideEligible: boolean;
  selfIssuedOverrideAllowed: false;
  escalationRoutes: readonly string[];
  evidenceLinks: readonly MissionConsoleEvidenceLink[];
}>;

export type AutonomyBoundary = Readonly<{
  decision: ConstitutionalDecision;
  visibilityOnly: true;
  currentLevel: AutonomyLevel;
  ceilingLevel: AutonomyLevel;
  authorityClasses: readonly string[];
  escalationTriggers: readonly string[];
  approvalRequirements: readonly string[];
  governanceRequirements: readonly string[];
  deniedOperations: readonly string[];
}>;

export type GovernanceDecision = Readonly<{
  decisionId: string;
  scope: ConstitutionalGovernanceScope;
  outcome: ConstitutionalDecision;
  reason: string;
  policySnapshotHash: string;
  replaySnapshotHash: string;
  governanceLineageHash: string;
  approvalLineageHash: string;
  authorityLineageHash: string;
  constitutionalDecisionHash: string;
  evidenceLinks: readonly MissionConsoleEvidenceLink[];
  disputed: boolean;
}>;

export type ConstitutionalAuditRecord = Readonly<{
  recordId: string;
  scope: ConstitutionalGovernanceScope;
  outcome: ConstitutionalDecision;
  timestamp: string;
  reason: string;
  evidenceHashes: readonly string[];
  lineageHashes: readonly string[];
}>;

export type ConstitutionalViolation = Readonly<{
  violationId: string;
  scope: ConstitutionalGovernanceScope;
  code: ConstitutionalGovernanceError["code"];
  message: string;
  evidenceLinks: readonly MissionConsoleEvidenceLink[];
}>;

export type ConstitutionalGovernanceView = Readonly<{
  viewId: string;
  generatedAt: string;
  missionId: string;
  executionId: string;
  state: ConstitutionalDecision;
  constitutionalDecisionHash: string;
  sourceAuthorities: readonly MissionConsoleSourceAuthority[];
  policy: ConstitutionalPolicy;
  authorityBoundaries: readonly AuthorityBoundary[];
  replayAuthority: ReplayAuthority;
  snapshotAccess: SnapshotAccessGrant;
  simulationScope: SimulationScope;
  recoveryAuthorization: RecoveryAuthorization;
  escalationAuthority: EscalationAuthority;
  autonomyBoundary: AutonomyBoundary;
  decisions: readonly GovernanceDecision[];
  auditTimeline: readonly ConstitutionalAuditRecord[];
  violations: readonly ConstitutionalViolation[];
  warnings: readonly string[];
  errors: readonly ConstitutionalGovernanceError[];
}>;

export type MissionConsoleGovernanceContext = Readonly<{
  autonomy: Pick<MissionConsoleView["autonomy"], "autonomyLevel">;
  approvals: Readonly<{
    data: Pick<MissionConsoleView["approvals"]["data"], "escalationRoutes">;
  }>;
  recovery: Readonly<{
    data: Pick<MissionConsoleView["recovery"]["data"], "readiness">;
  }>;
  simulation: Readonly<{
    data: Pick<MissionConsoleView["simulation"]["data"], "readOnly" | "branchOutcomes">;
  }>;
  warnings: MissionConsoleView["warnings"];
  errors: MissionConsoleView["errors"];
}>;

export type ConstitutionalGovernanceInput = Readonly<{
  missionId: string;
  executionId: string;
  generatedAt: string;
  treaty: ExecutionTreatyPackage;
  validation: ValidationPipelineOutput;
  traceView: StepTraceView;
  policyExplanation: PolicyDecisionExplanation;
  diffInspection: PlanDiffInspectionResult;
  replay: ReplayReconstructionResult;
  snapshots: readonly ConstitutionalSnapshotEnvelope[];
  consoleView: MissionConsoleGovernanceContext;
}>;
