import type {
  ConstitutionalAuditRecord,
  ConstitutionalDecision,
  ConstitutionalGovernanceInput,
  ConstitutionalGovernanceView,
  ConstitutionalPolicy,
  ConstitutionalViolation,
  GovernanceDecision,
} from "@/types/constitutional-governance";
import type { MissionConsoleSourceAuthority } from "@/types/mission-intelligence-console";
import { buildAuthorityBoundaryRegistry } from "@/services/authority-boundary-registry";
import { evaluateReplayGovernance } from "@/services/replay-governance-controller";
import { evaluateSnapshotAccess } from "@/services/snapshot-access-governor";
import { evaluateSimulationGovernance } from "@/services/simulation-governance-engine";
import { evaluateRecoveryAuthority } from "@/services/recovery-authority-engine";
import { evaluateEscalationGovernance } from "@/services/escalation-governance-engine";
import { evaluateAutonomyBoundary } from "@/services/autonomy-boundary-engine";
import { hashConstitutionalGovernanceValue } from "./constitutionalGovernanceHasher";
import { validateConstitutionalGovernanceInput } from "./constitutionalGovernanceGuards";

function buildPolicy(input: ConstitutionalGovernanceInput): ConstitutionalPolicy {
  return Object.freeze({
    policyId: `constitutional-policy:${input.executionId}`,
    treatyId: input.treaty.manifest.treatyId,
    policySnapshotHash: input.treaty.manifest.governanceSnapshotHash,
    governanceLineageHash: input.treaty.evidence.governanceLineageHash,
    approvalLineageHash: input.treaty.manifest.approvalChainHash,
    authorityLineageHash: hashConstitutionalGovernanceValue("authority-lineage", {
      replay: input.treaty.evidence.replayLineageHash,
      registry: input.treaty.evidence.registryLineageHash,
      governance: input.treaty.evidence.governanceLineageHash,
    }),
    failClosed: true,
    unknownAuthorityDisposition: "DENY",
    rules: Object.freeze([
      "unknown-authority-deny",
      "replay-may-reconstruct-not-mutate",
      "simulation-may-inform-not-act",
      "recovery-requires-governance-approval",
      "autonomy-may-propose-not-self-authorize",
      "no-autonomous-decision-may-bypass-4.4H-governance",
    ]),
  });
}

function decideOverall(outcomes: readonly ConstitutionalDecision[]): ConstitutionalDecision {
  if (outcomes.includes("DENY")) {
    return "DENY";
  }
  if (outcomes.includes("ESCALATE")) {
    return "ESCALATE";
  }
  return "ALLOW";
}

function buildDecision(input: {
  generatedAt: string;
  scope: GovernanceDecision["scope"];
  outcome: ConstitutionalDecision;
  reason: string;
  policy: ConstitutionalPolicy;
  replaySnapshotHash: string;
  evidenceLinks: GovernanceDecision["evidenceLinks"];
  disputed: boolean;
}): GovernanceDecision {
  const constitutionalDecisionHash = hashConstitutionalGovernanceValue("constitutional-decision", {
    scope: input.scope,
    outcome: input.outcome,
    reason: input.reason,
    policySnapshotHash: input.policy.policySnapshotHash,
    replaySnapshotHash: input.replaySnapshotHash,
    governanceLineageHash: input.policy.governanceLineageHash,
    approvalLineageHash: input.policy.approvalLineageHash,
    authorityLineageHash: input.policy.authorityLineageHash,
  });

  return Object.freeze({
    decisionId: `${input.scope}:${constitutionalDecisionHash}`,
    scope: input.scope,
    outcome: input.outcome,
    reason: input.reason,
    policySnapshotHash: input.policy.policySnapshotHash,
    replaySnapshotHash: input.replaySnapshotHash,
    governanceLineageHash: input.policy.governanceLineageHash,
    approvalLineageHash: input.policy.approvalLineageHash,
    authorityLineageHash: input.policy.authorityLineageHash,
    constitutionalDecisionHash,
    evidenceLinks: input.evidenceLinks,
    disputed: input.disputed,
  });
}

function buildAuditTimeline(generatedAt: string, decisions: readonly GovernanceDecision[]): readonly ConstitutionalAuditRecord[] {
  return Object.freeze(
    decisions.map((decision, index) =>
      Object.freeze({
        recordId: `audit:${decision.scope}:${index + 1}`,
        scope: decision.scope,
        outcome: decision.outcome,
        timestamp: generatedAt,
        reason: decision.reason,
        evidenceHashes: Object.freeze(decision.evidenceLinks.map((entry) => entry.hash ?? "missing")),
        lineageHashes: Object.freeze([
          decision.policySnapshotHash,
          decision.replaySnapshotHash,
          decision.governanceLineageHash,
          decision.approvalLineageHash,
          decision.authorityLineageHash,
        ]),
      })),
  );
}

function buildViolations(input: {
  replayDecision: GovernanceDecision;
  snapshotDecision: GovernanceDecision;
  simulationDecision: GovernanceDecision;
  recoveryDecision: GovernanceDecision;
  escalationDecision: GovernanceDecision;
  autonomyDecision: GovernanceDecision;
}): readonly ConstitutionalViolation[] {
  const violations: ConstitutionalViolation[] = [];
  const maybePush = (decision: GovernanceDecision, code: ConstitutionalViolation["code"]) => {
    if (decision.outcome === "ALLOW" && !decision.disputed) {
      return;
    }
    violations.push(Object.freeze({
      violationId: `${decision.scope}:${code}`,
      scope: decision.scope,
      code,
      message: decision.reason,
      evidenceLinks: decision.evidenceLinks,
    }));
  };

  maybePush(input.replayDecision, "REPLAY_AUTHORITY_DENIED");
  maybePush(input.snapshotDecision, "SNAPSHOT_ACCESS_DENIED");
  maybePush(input.simulationDecision, "SIMULATION_SCOPE_INVALID");
  maybePush(input.recoveryDecision, "RECOVERY_AUTHORITY_REQUIRED");
  maybePush(input.escalationDecision, "ESCALATION_AUTHORITY_INVALID");
  maybePush(input.autonomyDecision, "AUTONOMY_SCOPE_EXCEEDED");

  return Object.freeze(violations);
}

function buildFailClosedView(input: Partial<ConstitutionalGovernanceInput>, errors: ConstitutionalGovernanceView["errors"]): ConstitutionalGovernanceView {
  const generatedAt = input.generatedAt ?? "1970-01-01T00:00:00.000Z";
  const missionId = input.missionId ?? "unknown-mission";
  const executionId = input.executionId ?? "unknown-execution";
  const policy = Object.freeze({
    policyId: "constitutional-policy:missing",
    treatyId: "missing",
    policySnapshotHash: "missing",
    governanceLineageHash: "missing",
    approvalLineageHash: "missing",
    authorityLineageHash: "missing",
    failClosed: true,
    unknownAuthorityDisposition: "DENY" as const,
    rules: Object.freeze(["unknown-authority-deny"]),
  });
  const sourceAuthorities: readonly MissionConsoleSourceAuthority[] = Object.freeze([
    "4.3O.execution-treaty",
    "4.4A.validation-core",
    "4.4B.step-trace-viewer",
    "4.4C.policy-decision-explainer",
    "4.4D.plan-diff-inspector",
    "4.4E.replay-reconstruction-engine",
    "4.4F.deterministic-snapshot-engine",
    "control-plane.review",
    "control-plane.approval",
    "control-plane.simulation",
    "console.operator-recovery",
  ]);
  return Object.freeze({
    viewId: hashConstitutionalGovernanceValue("constitutional-governance-fail-closed-id", { missionId, executionId, generatedAt }),
    generatedAt,
    missionId,
    executionId,
    state: "DENY",
    constitutionalDecisionHash: hashConstitutionalGovernanceValue("constitutional-governance-fail-closed", { missionId, executionId, errors }),
    sourceAuthorities,
    policy,
    authorityBoundaries: Object.freeze([]),
    replayAuthority: Object.freeze({
      decision: "DENY",
      lineageValid: false,
      allowedOperations: Object.freeze([]),
      deniedOperations: Object.freeze(["inspect", "compare", "export-evidence", "mutate", "execute"]),
      replaySnapshotHash: "missing",
      replayLineageHash: "missing",
      evidenceLinks: Object.freeze([]),
    }),
    snapshotAccess: Object.freeze({
      decision: "DENY",
      visibleSnapshotIds: Object.freeze([]),
      branchAuthorityValid: false,
      forensicVisibility: "DENIED" as const,
      evidenceLinks: Object.freeze([]),
    }),
    simulationScope: Object.freeze({
      decision: "DENY",
      readOnly: true,
      branchSimulationVisible: false,
      alternateOutcomeVisible: false,
      deniedOperations: Object.freeze(["execute", "orchestrate", "mutate-runtime", "mutate-policy"]),
      evidenceLinks: Object.freeze([]),
    }),
    recoveryAuthorization: Object.freeze({
      decision: "DENY",
      approvalRequired: true,
      blastRadius: "unknown" as const,
      lineageValid: false,
      blockedReasons: Object.freeze(["missing-governance-context"]),
      evidenceLinks: Object.freeze([]),
    }),
    escalationAuthority: Object.freeze({
      decision: "DENY",
      pauseAuthority: false,
      overrideEligible: false,
      selfIssuedOverrideAllowed: false,
      escalationRoutes: Object.freeze([]),
      evidenceLinks: Object.freeze([]),
    }),
    autonomyBoundary: Object.freeze({
      decision: "DENY",
      visibilityOnly: true,
      currentLevel: "A0",
      ceilingLevel: "A0",
      authorityClasses: Object.freeze([]),
      escalationTriggers: Object.freeze([]),
      approvalRequirements: Object.freeze([]),
      governanceRequirements: Object.freeze([]),
      deniedOperations: Object.freeze(["self-authorize", "execute", "recursive-authority-escalation", "hidden-execution"]),
    }),
    decisions: Object.freeze([]),
    auditTimeline: Object.freeze([]),
    violations: Object.freeze([]),
    warnings: Object.freeze([]),
    errors,
  });
}

export function buildConstitutionalGovernanceView(input: ConstitutionalGovernanceInput): ConstitutionalGovernanceView {
  const errors = validateConstitutionalGovernanceInput(input);
  if (errors.length > 0) {
    return buildFailClosedView(input, errors);
  }

  const policy = buildPolicy(input);
  const authorityBoundaries = buildAuthorityBoundaryRegistry(input);
  const replayAuthority = evaluateReplayGovernance(input);
  const snapshotAccess = evaluateSnapshotAccess(input);
  const simulationScope = evaluateSimulationGovernance(input);
  const recoveryAuthorization = evaluateRecoveryAuthority(input);
  const escalationAuthority = evaluateEscalationGovernance(input);
  const autonomyBoundary = evaluateAutonomyBoundary(input);

  const replayDecision = buildDecision({
    generatedAt: input.generatedAt,
    scope: "replay",
    outcome: replayAuthority.decision,
    reason: replayAuthority.lineageValid ? "Replay lineage is immutable and reconstructible." : "Replay lineage is disputed or invalid.",
    policy,
    replaySnapshotHash: replayAuthority.replaySnapshotHash,
    evidenceLinks: replayAuthority.evidenceLinks,
    disputed: !replayAuthority.lineageValid,
  });
  const snapshotDecision = buildDecision({
    generatedAt: input.generatedAt,
    scope: "snapshot",
    outcome: snapshotAccess.decision,
    reason: snapshotAccess.branchAuthorityValid ? "Snapshot lineage remains immutable and visible." : "Snapshot lineage or branch authority is disputed.",
    policy,
    replaySnapshotHash: input.treaty.manifest.replaySnapshotHash,
    evidenceLinks: snapshotAccess.evidenceLinks,
    disputed: !snapshotAccess.branchAuthorityValid,
  });
  const simulationDecision = buildDecision({
    generatedAt: input.generatedAt,
    scope: "simulation",
    outcome: simulationScope.decision,
    reason: simulationScope.readOnly ? "Simulation is visibility-only and evidence-bound." : "Simulation scope is invalid.",
    policy,
    replaySnapshotHash: input.treaty.manifest.replaySnapshotHash,
    evidenceLinks: simulationScope.evidenceLinks,
    disputed: simulationScope.decision !== "ALLOW",
  });
  const recoveryDecision = buildDecision({
    generatedAt: input.generatedAt,
    scope: "recovery",
    outcome: recoveryAuthorization.decision,
    reason: recoveryAuthorization.blockedReasons.length
      ? `Recovery remains blocked: ${recoveryAuthorization.blockedReasons.join(", ")}`
      : "Recovery may proceed only through governed approval.",
    policy,
    replaySnapshotHash: input.treaty.manifest.replaySnapshotHash,
    evidenceLinks: recoveryAuthorization.evidenceLinks,
    disputed: recoveryAuthorization.blockedReasons.length > 0,
  });
  const escalationDecision = buildDecision({
    generatedAt: input.generatedAt,
    scope: "escalation",
    outcome: escalationAuthority.decision,
    reason: escalationAuthority.escalationRoutes.length
      ? "Escalation remains governed by routed human review."
      : "Escalation routing is missing or invalid.",
    policy,
    replaySnapshotHash: input.treaty.manifest.replaySnapshotHash,
    evidenceLinks: escalationAuthority.evidenceLinks,
    disputed: escalationAuthority.escalationRoutes.length === 0,
  });
  const autonomyDecision = buildDecision({
    generatedAt: input.generatedAt,
    scope: "autonomy",
    outcome: autonomyBoundary.decision,
    reason: autonomyBoundary.decision === "ALLOW"
      ? "Autonomy remains visibility-only within constitutional ceilings."
      : "Autonomy level exceeds the constitutional ceiling.",
    policy,
    replaySnapshotHash: input.treaty.manifest.replaySnapshotHash,
    evidenceLinks: Object.freeze(
      input.snapshots
        .filter((snapshot) => snapshot.snapshotType === "autonomy_classification" || snapshot.snapshotType === "adaptation")
        .map((snapshot) => ({
          label: snapshot.snapshotType,
          authority: "4.4F.deterministic-snapshot-engine" as const,
          hash: snapshot.integrityHash,
          ref: snapshot.snapshotId,
        })),
    ),
    disputed: autonomyBoundary.decision !== "ALLOW",
  });

  const decisions = Object.freeze([
    replayDecision,
    snapshotDecision,
    simulationDecision,
    recoveryDecision,
    escalationDecision,
    autonomyDecision,
  ]);
  const auditTimeline = buildAuditTimeline(input.generatedAt, decisions);
  const violations = buildViolations({
    replayDecision,
    snapshotDecision,
    simulationDecision,
    recoveryDecision,
    escalationDecision,
    autonomyDecision,
  });
  const state = decideOverall(decisions.map((decision) => decision.outcome));

  const constitutionalDecisionHash = hashConstitutionalGovernanceValue("constitutional-governance-view", {
    missionId: input.missionId,
    executionId: input.executionId,
    policy,
    authorityBoundaries,
    replayAuthority,
    snapshotAccess,
    simulationScope,
    recoveryAuthorization,
    escalationAuthority,
    autonomyBoundary,
    decisions,
    violations,
  });

  return Object.freeze({
    viewId: hashConstitutionalGovernanceValue("constitutional-governance-view-id", {
      missionId: input.missionId,
      executionId: input.executionId,
      generatedAt: input.generatedAt,
    }),
    generatedAt: input.generatedAt,
    missionId: input.missionId,
    executionId: input.executionId,
    state,
    constitutionalDecisionHash,
    sourceAuthorities,
    policy,
    authorityBoundaries,
    replayAuthority,
    snapshotAccess,
    simulationScope,
    recoveryAuthorization,
    escalationAuthority,
    autonomyBoundary,
    decisions,
    auditTimeline,
    violations,
    warnings: Object.freeze([
      ...input.consoleView.warnings,
      ...(state === "ALLOW" ? [] : ["Constitutional governance requires continued human oversight."]),
    ]),
    errors: Object.freeze(
      input.consoleView.errors.map((error) => ({
        code: "CONSTITUTIONAL_LINEAGE_DISPUTED" as const,
        message: error.message,
        path: error.path,
      })),
    ),
  });
}
  const sourceAuthorities: readonly MissionConsoleSourceAuthority[] = Object.freeze([
    "4.3O.execution-treaty",
    "4.4A.validation-core",
    "4.4B.step-trace-viewer",
    "4.4C.policy-decision-explainer",
    "4.4D.plan-diff-inspector",
    "4.4E.replay-reconstruction-engine",
    "4.4F.deterministic-snapshot-engine",
    "control-plane.review",
    "control-plane.approval",
    "control-plane.simulation",
    "console.operator-recovery",
  ]);
