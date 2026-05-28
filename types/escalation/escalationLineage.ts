import type { EscalationDecision, ConfidenceRiskProfile } from "./escalationContracts";

export type EscalationLineageEntry = Readonly<{
  entryId: string;
  escalationId: string;
  coordinationId: string;
  state: import("./escalationStates").EscalationState;
  severity: import("./escalationStates").EscalationSeverity;
  replayGraphHash: string;
  createdAt: string;
}>;

export type EscalationLineageLedger = Readonly<{
  ledgerId: string;
  entries: readonly EscalationLineageEntry[];
  lineageHash: string;
}>;

export type EscalationReplayNode = Readonly<{
  nodeId: string;
  sourceType: "freshness" | "lifecycle" | "correlation" | "coordination" | "readiness";
  sourceHash: string;
  createdAt: string;
}>;

export type EscalationReplayGraph = Readonly<{
  graphId: string;
  coordinationId: string;
  nodes: readonly EscalationReplayNode[];
  timelineHashes: readonly string[];
  replaySafe: boolean;
  createdAt: string;
  graphHash: string;
}>;

export type EscalationStateTimeline = Readonly<{
  coordinationId: string;
  states: readonly Readonly<{
    escalationId: string;
    state: import("./escalationStates").EscalationState;
    severity: import("./escalationStates").EscalationSeverity;
    createdAt: string;
  }>[];
  reconstructedDecision?: EscalationDecision;
  reconstructedProfile?: ConfidenceRiskProfile;
  timelineHash: string;
}>;
