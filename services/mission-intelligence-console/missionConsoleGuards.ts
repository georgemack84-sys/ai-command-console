import type { MissionConsoleBuildInput, MissionConsoleError, MissionConsoleSourceAuthority, MissionConsoleView } from "@/types/mission-intelligence-console";
import { hashMissionConsoleValue } from "./missionConsoleHasher";

const BANNED_IMPORT_PATTERNS = [
  /from\s+["'][^"']*([/\\](worker|queue|scheduler|child_process|adapter|jobRunner|dispatch|executionEngine)([/\\]|["']))/i,
  /require\(["'][^"']*([/\\](worker|queue|scheduler|child_process|adapter|jobRunner|dispatch|executionEngine)([/\\]|["']))\)/i,
  /from\s+["'][^"']*(shellExecution|shellCommand)["']/i,
  /require\(["'][^"']*(shellExecution|shellCommand)["']\)/i,
] as const;

const BANNED_CALL_PATTERNS = [
  /\bspawn\s*\(/,
  /\bexec\s*\(/,
  /\bexecFile\s*\(/,
  /\bfork\s*\(/,
  /\benqueue\w*\s*\(/i,
  /\bdispatch\w*\s*\(/i,
  /\bschedule\w*\s*\(/i,
  /\bstartWorker\s*\(/,
  /\bapply[A-Z]\w*\s*\(/,
  /\bapprove[A-Z]\w*\s*\(/,
] as const;

export function detectMissionConsoleMutationViolations(input: {
  sourceTexts: readonly { path: string; content: string }[];
}): { valid: boolean; errors: readonly string[] } {
  const errors: string[] = [];
  for (const source of input.sourceTexts) {
    if (source.path.endsWith("missionConsoleGuards.ts")) {
      continue;
    }
    for (const pattern of BANNED_IMPORT_PATTERNS) {
      if (pattern.test(source.content)) {
        errors.push(`MISSION_CONSOLE_MUTATION_FORBIDDEN:${source.path}`);
      }
    }
    for (const pattern of BANNED_CALL_PATTERNS) {
      if (pattern.test(source.content)) {
        errors.push(`MISSION_CONSOLE_EXECUTION_FORBIDDEN:${source.path}`);
      }
    }
  }
  return { valid: errors.length === 0, errors: Object.freeze(errors) };
}

export function guardMissionConsoleInput(input: Partial<MissionConsoleBuildInput>): readonly MissionConsoleError[] {
  const errors: MissionConsoleError[] = [];
  if (!input.treaty || !input.validation || !input.traceView || !input.policyExplanation || !input.diffInspection || !input.replay) {
    errors.push({
      code: "MISSION_CONSOLE_SOURCE_AUTHORITY_MISSING",
      message: "mission console requires upstream treaty, validation, trace, policy, drift, and replay authorities",
      path: "input",
    });
  }
  if (!input.snapshots?.length) {
    errors.push({
      code: "MISSION_CONSOLE_SNAPSHOT_UNAVAILABLE",
      message: "mission console requires immutable snapshots",
      path: "snapshots",
    });
  }
  return Object.freeze(errors);
}

export function buildMissionConsoleFailClosedView(
  partial: Partial<MissionConsoleBuildInput>,
  errors: readonly MissionConsoleError[],
): MissionConsoleView {
  const generatedAt = partial.generatedAt ?? "1970-01-01T00:00:00.000Z";
  const executionId = partial.executionId ?? "unknown-execution";
  const missionId = partial.missionId ?? "unknown-mission";
  const sourceAuthorities = Object.freeze([
    "4.3O.execution-treaty",
    "4.4A.validation-core",
    "4.4B.step-trace-viewer",
    "4.4C.policy-decision-explainer",
    "4.4D.plan-diff-inspector",
    "4.4E.replay-reconstruction-engine",
    "4.4F.deterministic-snapshot-engine",
  ] as const);
  const viewId = hashMissionConsoleValue("mission-console-fail-closed-id", {
    missionId,
    executionId,
    generatedAt,
    errors,
  });
  const emptyDomain = <T,>(domain: MissionConsoleView["timeline"]["domain"], authority: readonly MissionConsoleSourceAuthority[], data: T) => Object.freeze({
    domain,
    state: "DISPUTED" as const,
    authority,
    evidenceLinks: Object.freeze([]),
    disputes: Object.freeze(errors.map((error) => ({
      domain,
      state: "DISPUTED" as const,
      reason: error.message,
      authority: authority[0],
      evidenceLinks: Object.freeze([]),
    }))),
    data,
  });

  return Object.freeze({
    viewId,
    missionId,
    executionId,
    generatedAt,
    consoleHash: hashMissionConsoleValue("mission-console-fail-closed", { viewId, errors }),
    sourceAuthorities,
    state: "DISPUTED",
    readiness: Object.freeze({
      state: "DISPUTED",
      summary: "Mission intelligence is disputed because required source authority is missing.",
      evidenceLinks: Object.freeze([]),
    }),
    autonomy: Object.freeze({
      visibilityOnly: true,
      autonomyLevel: "A0",
      confidenceLabel: "low",
      escalationVisible: true,
      simulationVisible: true,
      governanceInterventionVisible: true,
      approvalVisible: true,
      recoveryVisible: true,
      constitutionalRule: "NO_AUTONOMOUS_DECISION_MAY_BYPASS_GOVERNANCE",
    }),
    interventions: Object.freeze([]),
    operatorActions: Object.freeze([]),
    timeline: emptyDomain("timeline", Object.freeze(["4.4A.validation-core"]), { entries: Object.freeze([]) }),
    replay: emptyDomain("replay", Object.freeze(["4.4E.replay-reconstruction-engine"]), {
      replayId: "unavailable",
      replayState: "DISPUTED",
      reconstructionHash: "unavailable",
      integrityValid: false,
      driftTypes: Object.freeze([]),
      branchVisible: false,
      comparisonSummary: Object.freeze([]),
    }),
    drift: emptyDomain("drift", Object.freeze(["4.4D.plan-diff-inspector"]), {
      result: "UNINSPECTABLE",
      driftClass: "UNKNOWN_DRIFT",
      changedPaths: Object.freeze([]),
      replayValid: false,
      hashMismatch: false,
    }),
    governance: emptyDomain("governance", Object.freeze(["4.4C.policy-decision-explainer"]), {
      finalDecision: "unknown",
      denialReasons: Object.freeze([]),
      enforcementChain: Object.freeze([]),
      interventionPoints: Object.freeze([]),
      constitutionalConstraints: Object.freeze([]),
    }),
    snapshots: emptyDomain("snapshots", Object.freeze(["4.4F.deterministic-snapshot-engine"]), { snapshots: Object.freeze([]) }),
    dependencies: emptyDomain("dependencies", Object.freeze(["4.4B.step-trace-viewer", "4.4A.validation-core"]), {
      nodes: Object.freeze([]),
      edges: Object.freeze([]),
      unresolvedDependencies: Object.freeze([]),
      cycleDetected: false,
    }),
    simulation: emptyDomain("simulation", Object.freeze(["4.4E.replay-reconstruction-engine", "4.4F.deterministic-snapshot-engine"]), {
      readOnly: true as const,
      branchOutcomes: Object.freeze([]),
      rollbackSimulationVisible: true,
      escalationSimulationVisible: true,
      governanceSimulationVisible: true,
    }),
    recovery: emptyDomain("recovery", Object.freeze(["console.operator-recovery"]), {
      readiness: "DISPUTED",
      rollbackLineage: Object.freeze([]),
      containmentState: "unavailable",
      approvalRequirements: Object.freeze([]),
      blockedReasons: Object.freeze([]),
      risk: "unknown",
    }),
    approvals: emptyDomain("approvals", Object.freeze(["control-plane.approval"]), {
      approvalChain: Object.freeze([]),
      pendingReviews: Object.freeze([]),
      signedApprovals: Object.freeze([]),
      revokedApprovals: Object.freeze([]),
      escalationRoutes: Object.freeze([]),
      overrideConstraints: Object.freeze([]),
      operatorActionHistory: Object.freeze([]),
    }),
    warnings: Object.freeze([]),
    errors: Object.freeze(errors),
  });
}
