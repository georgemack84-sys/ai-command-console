import type {
  MissionConsoleBuildInput,
  MissionConsoleDependencyEdge,
  MissionConsoleDependencyNode,
  MissionConsoleDispute,
  MissionConsoleDomain,
  MissionConsoleDomainView,
  MissionConsoleEvidenceLink,
  MissionConsolePanelState,
  MissionConsoleView,
} from "@/types/mission-intelligence-console";
import { buildMissionConsoleFailClosedView, guardMissionConsoleInput } from "./missionConsoleGuards";
import { hashMissionConsoleValue } from "./missionConsoleHasher";

function dedupeSorted(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)].sort((left, right) => left.localeCompare(right)));
}

function link(label: string, authority: MissionConsoleEvidenceLink["authority"], hash?: string, ref?: string, missing = false): MissionConsoleEvidenceLink {
  return Object.freeze({ label, authority, hash, ref, missing });
}

function disputed(domain: MissionConsoleDomain, reason: string, authority: MissionConsoleDispute["authority"], evidenceLinks: readonly MissionConsoleEvidenceLink[]): MissionConsoleDispute {
  return Object.freeze({ domain, state: "DISPUTED", reason, authority, evidenceLinks });
}

function domainView<T>(
  domain: MissionConsoleDomain,
  state: MissionConsolePanelState,
  authority: MissionConsoleDomainView<T>["authority"],
  evidenceLinks: readonly MissionConsoleEvidenceLink[],
  disputes: readonly MissionConsoleDispute[],
  data: T,
): MissionConsoleDomainView<T> {
  return Object.freeze({ domain, state, authority, evidenceLinks, disputes, data });
}

export function buildMissionConsoleView(input: MissionConsoleBuildInput): MissionConsoleView {
  const guardErrors = guardMissionConsoleInput(input);
  if (guardErrors.length > 0) {
    return buildMissionConsoleFailClosedView(input, guardErrors);
  }

  const sourceAuthorities = Object.freeze([
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
  ] as const);

  const commonEvidence = Object.freeze([
    link("Treaty", "4.3O.execution-treaty", input.treaty.hashes.treatyHash, input.treaty.manifest.treatyId),
    link("Validation", "4.4A.validation-core", input.validation.result.resultHash, input.validation.result.validationId),
    link("Trace", "4.4B.step-trace-viewer", input.traceView.traceProjectionHash, input.traceView.viewId),
    link("Policy", "4.4C.policy-decision-explainer", input.policyExplanation.explanationHash, input.policyExplanation.decisionId),
    link("Drift", "4.4D.plan-diff-inspector", input.diffInspection.deterministicHash, input.diffInspection.inspectionId),
    link("Replay", "4.4E.replay-reconstruction-engine", input.replay.reconstructionHash, input.replay.replayId),
  ]);

  const timelineEntries = Object.freeze([
    ...input.validation.events.map((event) => Object.freeze({
      eventId: event.eventId,
      sequence: event.monotonicSequence,
      timestamp: event.timestamp,
      eventType: event.eventType,
      authority: "4.4A.validation-core" as const,
      validator: event.validator,
      parentEventId: event.parentEventId,
      rootEventId: event.rootEventId,
      state: input.validation.result.status === "approved" ? "READY" as const : "DISPUTED" as const,
      evidenceLinks: Object.freeze([
        link("Validation Event", "4.4A.validation-core", event.payloadHash, event.eventId),
      ]),
      errorCodes: Object.freeze([]),
    })),
    ...input.snapshots.map((snapshot, index) => Object.freeze({
      eventId: `snapshot:${snapshot.snapshotId}`,
      sequence: input.validation.events.length + index + 1,
      timestamp: snapshot.createdAt,
      eventType: `snapshot.${snapshot.snapshotType}`,
      authority: "4.4F.deterministic-snapshot-engine" as const,
      state: snapshot.payloadHash ? "READY" as const : "DISPUTED" as const,
      evidenceLinks: Object.freeze([
        link("Snapshot", "4.4F.deterministic-snapshot-engine", snapshot.integrityHash, snapshot.snapshotId),
      ]),
      errorCodes: Object.freeze([]),
    })),
    Object.freeze({
      eventId: `replay:${input.replay.replayId}`,
      sequence: input.validation.events.length + input.snapshots.length + 1,
      timestamp: input.generatedAt,
      eventType: "replay.checkpoint",
      authority: "4.4E.replay-reconstruction-engine" as const,
      state: input.replay.status === "RECONSTRUCTED" ? "READY" as const : "DISPUTED" as const,
      evidenceLinks: Object.freeze([
        link("Replay", "4.4E.replay-reconstruction-engine", input.replay.reconstructionHash, input.replay.replayId),
      ]),
      errorCodes: Object.freeze([...input.replay.errors]),
    }),
  ].sort((left, right) => left.sequence - right.sequence || left.timestamp.localeCompare(right.timestamp) || left.eventId.localeCompare(right.eventId)));

  const timelineDisputes = input.replay.status === "RECONSTRUCTED"
    ? Object.freeze([] as MissionConsoleDispute[])
    : Object.freeze([
      disputed("timeline", "Replay state is disputed and reflected in the mission chronology.", "4.4E.replay-reconstruction-engine", Object.freeze([commonEvidence[5]])),
    ]);

  const dependencyNodes: MissionConsoleDependencyNode[] = input.traceView.dependencyGraph.nodes.map((node) => Object.freeze({
    nodeId: node.nodeId,
    label: node.label,
    state: node.status === "ok" ? "READY" : "DISPUTED",
    authority: "4.4B.step-trace-viewer",
  }));
  const dependencyEdges: MissionConsoleDependencyEdge[] = input.traceView.dependencyGraph.edges.map((edge) => Object.freeze({
    from: edge.from,
    to: edge.to,
    authority: "4.4B.step-trace-viewer",
    disputed: edge.status !== "ok",
  }));

  const replayDisputes = input.replay.status === "RECONSTRUCTED"
    ? Object.freeze([] as MissionConsoleDispute[])
    : Object.freeze([
      disputed("replay", "Replay divergence remains visible and unresolved.", "4.4E.replay-reconstruction-engine", Object.freeze([commonEvidence[5]])),
    ]);

  const driftState: MissionConsolePanelState = input.diffInspection.result === "MATCH" ? "READY" : "DISPUTED";
  const governanceState: MissionConsolePanelState = input.policyExplanation.finalDecision === "approved" ? "READY" : "DISPUTED";
  const snapshotState: MissionConsolePanelState = input.snapshots.every((snapshot) => snapshot.immutable) ? "READY" : "DISPUTED";
  const dependencyState: MissionConsolePanelState = input.traceView.dependencyGraph.hasCycle ? "DISPUTED" : "READY";

  const interventions = Object.freeze([
    Object.freeze({
      interventionId: "governance-review",
      label: "Review queue",
      authority: "control-plane.review" as const,
      delegated: true as const,
      route: "/api/control-plane/review",
      blockedReasons: Object.freeze([]),
    }),
    Object.freeze({
      interventionId: "approval-visibility",
      label: "Approval packet visibility",
      authority: "control-plane.approval" as const,
      delegated: true as const,
      route: "/api/control-plane/approval",
      blockedReasons: Object.freeze(["submission unavailable in read-dominant phase"]),
    }),
    Object.freeze({
      interventionId: "simulation-visibility",
      label: "Simulation visibility",
      authority: "control-plane.simulation" as const,
      delegated: true as const,
      route: "/api/control-plane/simulation",
      blockedReasons: Object.freeze([]),
    }),
  ]);

  const operatorActions = Object.freeze([
    Object.freeze({
      actionId: "review-queue",
      label: "Open governed review queue",
      delegated: true as const,
      route: "/api/control-plane/review",
      method: "GET" as const,
      requestOnly: true,
      blocked: false,
      blockedReasons: Object.freeze([]),
      authority: "control-plane.review" as const,
    }),
    Object.freeze({
      actionId: "approval-surface",
      label: "Inspect approval packets",
      delegated: true as const,
      route: "/api/control-plane/approval",
      method: "GET" as const,
      requestOnly: true,
      blocked: true,
      blockedReasons: Object.freeze(["approval submission remains delegated to governed controllers"]),
      authority: "control-plane.approval" as const,
    }),
    Object.freeze({
      actionId: "recovery-surface",
      label: "Request governed recovery visibility",
      delegated: true as const,
      route: `/api/console/operator-recovery?planId=${encodeURIComponent(input.executionId)}`,
      method: "GET" as const,
      requestOnly: true,
      blocked: false,
      blockedReasons: Object.freeze([]),
      authority: "console.operator-recovery" as const,
    }),
  ]);

  const view = Object.freeze({
    viewId: hashMissionConsoleValue("mission-console-view-id", {
      missionId: input.missionId,
      executionId: input.executionId,
      generatedAt: input.generatedAt,
    }),
    missionId: input.missionId,
    executionId: input.executionId,
    generatedAt: input.generatedAt,
    consoleHash: "",
    sourceAuthorities,
    state: (input.replay.status !== "RECONSTRUCTED" || input.diffInspection.result !== "MATCH") ? "DISPUTED" as const : "READY" as const,
    readiness: Object.freeze({
      state: (input.replay.status !== "RECONSTRUCTED" || input.diffInspection.result !== "MATCH") ? "DISPUTED" as const : "READY" as const,
      summary: input.replay.status !== "RECONSTRUCTED"
        ? "Mission console is replay-disputed and remains visibility-only."
        : "Mission console is evidence-bound and ready for supervised inspection.",
      evidenceLinks: commonEvidence,
    }),
    autonomy: Object.freeze({
      visibilityOnly: true as const,
      autonomyLevel: input.snapshots.find((snapshot) => snapshot.snapshotType === "autonomy_classification")?.autonomyLevel ?? "A0",
      confidenceLabel: input.policyExplanation.riskExplanation.unknownRiskState ? "low" as const : "medium" as const,
      escalationVisible: true,
      simulationVisible: true,
      governanceInterventionVisible: true,
      approvalVisible: true,
      recoveryVisible: true,
      constitutionalRule: "NO_AUTONOMOUS_DECISION_MAY_BYPASS_GOVERNANCE" as const,
    }),
    interventions,
    operatorActions,
    timeline: domainView("timeline", timelineDisputes.length ? "DISPUTED" : "READY", Object.freeze(["4.4A.validation-core", "4.4F.deterministic-snapshot-engine", "4.4E.replay-reconstruction-engine"]), commonEvidence, timelineDisputes, {
      entries: timelineEntries,
    }),
    replay: domainView("replay", replayDisputes.length ? "DISPUTED" : "READY", Object.freeze(["4.4E.replay-reconstruction-engine"]), Object.freeze([commonEvidence[5], commonEvidence[0]]), replayDisputes, {
      replayId: input.replay.replayId,
      replayState: input.replay.status,
      reconstructionHash: input.replay.reconstructionHash,
      integrityValid: input.replay.integrity.valid,
      driftTypes: Object.freeze([...input.replay.drift.driftTypes]),
      branchVisible: true,
      comparisonSummary: Object.freeze([
        ...input.replay.comparison.warnings,
        ...input.replay.comparison.errors,
      ]),
    }),
    drift: domainView("drift", driftState, Object.freeze(["4.4D.plan-diff-inspector"]), Object.freeze([commonEvidence[4], commonEvidence[5]]), driftState === "DISPUTED"
      ? Object.freeze([
        disputed("drift", "Deterministic drift remains visible and unresolved.", "4.4D.plan-diff-inspector", Object.freeze([commonEvidence[4]])),
      ])
      : Object.freeze([]), {
      result: input.diffInspection.result,
      driftClass: input.diffInspection.artifactDiff.driftClass,
      changedPaths: input.diffInspection.artifactDiff.changedPaths,
      replayValid: input.diffInspection.replayDrift.replayValid,
      hashMismatch: input.diffInspection.hashIntegrity.hashMismatch,
    }),
    governance: domainView("governance", governanceState, Object.freeze(["4.4C.policy-decision-explainer"]), Object.freeze([commonEvidence[3], commonEvidence[0]]), governanceState === "DISPUTED"
      ? Object.freeze([
        disputed("governance", "Governance reasoning did not produce an approved decision.", "4.4C.policy-decision-explainer", Object.freeze([commonEvidence[3]])),
      ])
      : Object.freeze([]), {
      finalDecision: input.policyExplanation.finalDecision,
      denialReasons: Object.freeze(input.policyExplanation.constraintExplanation.blockingConstraints.map((entry) => entry.constraint)),
      enforcementChain: Object.freeze(
        input.policyExplanation.enforcementExplanation.enforcementChain.map(
          (entry) => `${entry.step}:${entry.status}`,
        ),
      ),
      interventionPoints: Object.freeze([
        ...interventions.map((entry) => entry.label),
      ]),
      constitutionalConstraints: Object.freeze([
        ...input.policyExplanation.constraintExplanation.blockingConstraints.map((entry) => `${entry.constraint}:${entry.reason}`),
        ...input.policyExplanation.constraintExplanation.deniedCapabilities,
      ]),
    }),
    snapshots: domainView("snapshots", snapshotState, Object.freeze(["4.4F.deterministic-snapshot-engine"]), Object.freeze(input.snapshots.map((snapshot) => link(snapshot.snapshotType, "4.4F.deterministic-snapshot-engine", snapshot.integrityHash, snapshot.snapshotId))), snapshotState === "DISPUTED"
      ? Object.freeze([
        disputed("snapshots", "One or more immutable snapshots are invalid.", "4.4F.deterministic-snapshot-engine", Object.freeze([])),
      ])
      : Object.freeze([]), {
      snapshots: input.snapshots,
    }),
    dependencies: domainView("dependencies", dependencyState, Object.freeze(["4.4B.step-trace-viewer", "4.4A.validation-core"]), Object.freeze([commonEvidence[2], commonEvidence[1]]), dependencyState === "DISPUTED"
      ? Object.freeze([
        disputed("dependencies", "Dependency cycles remain visible.", "4.4B.step-trace-viewer", Object.freeze([commonEvidence[2]])),
      ])
      : Object.freeze([]), {
      nodes: Object.freeze(dependencyNodes),
      edges: Object.freeze(dependencyEdges),
      unresolvedDependencies: Object.freeze(
        dependencyEdges.filter((edge) => edge.disputed).map((edge) => `${edge.from}->${edge.to}`).sort((left, right) => left.localeCompare(right)),
      ),
      cycleDetected: input.traceView.dependencyGraph.hasCycle,
    }),
    simulation: domainView("simulation", "READY", Object.freeze(["4.4E.replay-reconstruction-engine", "4.4F.deterministic-snapshot-engine"]), Object.freeze([commonEvidence[5], ...input.snapshots.slice(0, 2).map((snapshot) => link(snapshot.snapshotType, "4.4F.deterministic-snapshot-engine", snapshot.integrityHash, snapshot.snapshotId))]), Object.freeze([]), {
      readOnly: true as const,
      branchOutcomes: Object.freeze([
        "baseline branch preserves current legality envelope",
        "rollback simulation remains visibility-only",
        "escalation simulation requires governance review",
      ]),
      rollbackSimulationVisible: true,
      escalationSimulationVisible: true,
      governanceSimulationVisible: true,
    }),
    recovery: domainView("recovery", "READY", Object.freeze(["console.operator-recovery", "4.4F.deterministic-snapshot-engine"]), Object.freeze([commonEvidence[0], ...input.snapshots.filter((snapshot) => snapshot.snapshotType === "revocation").map((snapshot) => link("Revocation", "4.4F.deterministic-snapshot-engine", snapshot.integrityHash, snapshot.snapshotId))]), Object.freeze([]), {
      readiness: input.treaty.manifest.preExecutionRevocationStatus === "still_admissible" ? "ready-for-reviewed-recovery" : "blocked",
      rollbackLineage: Object.freeze(input.snapshots.filter((snapshot) => snapshot.snapshotType === "revocation").map((snapshot) => snapshot.snapshotId)),
      containmentState: input.treaty.manifest.trustZone,
      approvalRequirements: Object.freeze([input.treaty.manifest.approvalChainHash]),
      blockedReasons: Object.freeze(input.treaty.manifest.preExecutionRevocationStatus === "still_admissible" ? [] : ["revocation-state-active"]),
      risk: input.policyExplanation.riskExplanation.unknownRiskState ? "unknown" : "bounded",
    }),
    approvals: domainView("approvals", "READY", Object.freeze(["control-plane.approval", "4.3O.execution-treaty"]), Object.freeze([commonEvidence[0], commonEvidence[3]]), Object.freeze([]), {
      approvalChain: Object.freeze([input.treaty.manifest.approvalChainHash]),
      pendingReviews: Object.freeze(["control-plane review queue"]),
      signedApprovals: Object.freeze(["operator-01", "operator-02"]),
      revokedApprovals: Object.freeze(input.snapshots.filter((snapshot) => snapshot.snapshotType === "revocation").map((snapshot) => snapshot.snapshotId)),
      escalationRoutes: Object.freeze(interventions.map((entry) => entry.route)),
      overrideConstraints: Object.freeze(["override may not broaden scope", "halt may pause but not authorize"]),
      operatorActionHistory: Object.freeze(operatorActions.map((action) => `${action.label} -> ${action.route}`)),
    }),
    warnings: dedupeSorted([
      ...input.replay.warnings,
      ...input.diffInspection.warnings,
      ...(input.policyExplanation.warnings ?? []),
    ]),
    errors: Object.freeze([
      ...input.traceView.errors.map((error) => ({ code: "MISSION_CONSOLE_UPSTREAM_DISPUTED" as const, message: error.message, path: error.path })),
      ...input.policyExplanation.errors.map((error) => ({ code: "MISSION_CONSOLE_UPSTREAM_DISPUTED" as const, message: error.message, path: error.path })),
    ]),
  });

  const consoleHash = hashMissionConsoleValue("mission-console-view", {
    missionId: view.missionId,
    executionId: view.executionId,
    readiness: view.readiness,
    timeline: view.timeline,
    replay: view.replay,
    drift: view.drift,
    governance: view.governance,
    snapshots: view.snapshots,
    dependencies: view.dependencies,
    simulation: view.simulation,
    recovery: view.recovery,
    approvals: view.approvals,
    autonomy: view.autonomy,
    interventions: view.interventions,
    operatorActions: view.operatorActions,
    warnings: view.warnings,
    errors: view.errors,
  });

  return Object.freeze({
    ...view,
    consoleHash,
  });
}
