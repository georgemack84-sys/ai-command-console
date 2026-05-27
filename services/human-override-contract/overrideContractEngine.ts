import type {
  FreezeState,
  KillSwitchEvent,
  OverrideConflict,
  OverrideContractError,
  OverrideEvent,
  OverrideLineageLedger,
  OverrideReplayBinding,
} from "@/types/human-override-contract";
import type { ApprovalDependencyGraph } from "@/types/approval-dependency-graph";
import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { ReplayReconstructionResult } from "@/types/replay-reconstruction-engine";
import { validateOverrideEventSchema } from "./overrideSchemas";
import { guardOverrideInputs } from "./overrideGuards";
import { validateOverrideAuthority } from "./overrideAuthorityValidator";
import { resolveOverrideConflicts } from "./overrideConflictResolver";
import { deriveFreezeState } from "./freezeStateDeriver";
import { deriveKillSwitchEvent } from "./killSwitchContract";
import { bindOverrideReplay } from "./overrideReplayBinder";
import { appendOverrideLineage } from "./overrideLineageLedger";
import { hashOverrideValue } from "./overrideHasher";

export type OverrideContractInput = Readonly<{
  events: readonly OverrideEvent[];
  proposal: ProposalRecord;
  approvalGraph: ApprovalDependencyGraph;
  governanceView: ConstitutionalGovernanceView;
  replay: ReplayReconstructionResult;
  existingLineage?: OverrideLineageLedger;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type OverrideContractRecord = Readonly<{
  contractId: string;
  authority: readonly ReturnType<typeof validateOverrideAuthority>["authority"][];
  conflicts: readonly OverrideConflict[];
  freezeState: FreezeState;
  killSwitch?: KillSwitchEvent;
  replayBinding: OverrideReplayBinding;
  lineage: OverrideLineageLedger;
  active: boolean;
  warnings: readonly string[];
  errors: readonly OverrideContractError[];
  overrideHash: string;
  derivedOnly: true;
}>;

export function buildOverrideContract(input: OverrideContractInput): OverrideContractRecord {
  const schemaErrors = input.events.flatMap((event) => validateOverrideEventSchema(event));
  const guardErrors = guardOverrideInputs({
    events: input.events,
    proposal: input.proposal,
    approvalGraph: input.approvalGraph,
    metadata: input.metadata,
  });
  const authorityResults = input.events.map((event) =>
    validateOverrideAuthority({
      event,
      governanceView: input.governanceView,
    }),
  );
  const authority = Object.freeze(authorityResults.map((result) => result.authority));
  const authorityErrors = authorityResults.flatMap((result) => result.errors);
  const conflictsResult = resolveOverrideConflicts(input.events);

  const orderedEvents = Object.freeze(
    [...input.events].sort((left, right) => left.timestamp.localeCompare(right.timestamp) || left.overrideId.localeCompare(right.overrideId)),
  );
  const freezeState = deriveFreezeState(orderedEvents, input.governanceView.constitutionalDecisionHash);
  const killSwitch = deriveKillSwitchEvent({
    events: orderedEvents,
    autonomyStateHash: input.proposal.proposalHash,
    governanceSnapshotHash: input.governanceView.policy.policySnapshotHash,
  });
  const lineageHash = hashOverrideValue("override-lineage-hash", {
    existingLineageId: input.existingLineage?.lineageId,
    events: orderedEvents,
    freezeState,
    killSwitch,
    approvalGraphHash: input.approvalGraph.graphHash,
  });
  const replayResult = bindOverrideReplay({
    event: orderedEvents[orderedEvents.length - 1] ?? Object.freeze({
      overrideId: "override:none",
      timestamp: "1970-01-01T00:00:00.000Z",
      operatorId: "none",
      operatorRole: "none",
      overrideType: "freeze" as const,
      targetType: "global" as const,
      targetId: "none",
      reasonCode: "none",
      justification: "none",
      authoritySnapshotHash: "none",
      governanceSnapshotHash: input.governanceView.policy.policySnapshotHash,
      approvalGraphHash: input.approvalGraph.graphHash,
      createdAt: "1970-01-01T00:00:00.000Z",
    }),
    proposal: input.proposal,
    approvalGraph: input.approvalGraph,
    replay: input.replay,
    lineageHash,
  });

  const lineage = orderedEvents.reduce<OverrideLineageLedger | undefined>((current, event) =>
    appendOverrideLineage({
      existing: current ?? input.existingLineage,
      event,
      freezeState,
      killSwitch,
      replayHash: replayResult.replayBinding.reconstructionHash,
      lineageHash,
    }), input.existingLineage);

  const errors = Object.freeze([
    ...schemaErrors,
    ...guardErrors,
    ...authorityErrors,
    ...conflictsResult.errors,
    ...replayResult.errors,
    ...(freezeState.active ? [{
      code: "OVERRIDE_FREEZE_ACTIVE" as const,
      message: "Freeze state is active and future autonomy progression is suspended.",
      path: "freezeState",
    }] : []),
    ...(killSwitch ? [{
      code: "OVERRIDE_KILL_SWITCH_ACTIVE" as const,
      message: "Kill switch is active and future autonomy progression is invalidated.",
      path: "killSwitch",
    }] : []),
  ]);

  return Object.freeze({
    contractId: hashOverrideValue("override-contract-id", {
      lineageHash,
      approvalGraphHash: input.approvalGraph.graphHash,
      latestOverrideId: orderedEvents[orderedEvents.length - 1]?.overrideId ?? "none",
    }),
    authority,
    conflicts: conflictsResult.conflicts,
    freezeState,
    killSwitch,
    replayBinding: replayResult.replayBinding,
    lineage: lineage ?? Object.freeze({
      lineageId: hashOverrideValue("override-empty-lineage-id", lineageHash),
      entries: Object.freeze([]),
      freezeState,
      killSwitch,
      immutable: true,
    }),
    active: freezeState.active || Boolean(killSwitch),
    warnings: Object.freeze([
      ...input.proposal.warnings,
      ...(freezeState.active ? ["Freeze state is derived from immutable override evidence."] : []),
      ...(killSwitch ? ["Kill switch state is append-only constitutional evidence."] : []),
    ]),
    errors,
    overrideHash: hashOverrideValue("override-contract", {
      orderedEvents,
      authority,
      conflicts: conflictsResult.conflicts,
      freezeState,
      killSwitch,
      replayBinding: replayResult.replayBinding,
      lineage,
      errors,
    }),
    derivedOnly: true,
  });
}
