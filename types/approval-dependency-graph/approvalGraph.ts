import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import type { ConstitutionalSnapshotEnvelope } from "@/types/deterministic-snapshot-engine";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { ReplayReconstructionResult } from "@/types/replay-reconstruction-engine";
import type { ApprovalDependencyNode } from "./approvalDependency";
import type { ApprovalLifecycleError } from "./approvalDependencyErrors";
import type { ApprovalInheritanceRecord } from "./approvalInheritance";
import type { ApprovalDependencyLedger } from "./approvalLineage";
import type { ApprovalReplayBinding } from "./approvalReplay";
import type { ApprovalRevocationPropagation } from "./approvalRevocation";
import type { ApprovalTimeWindow } from "./approvalTimeWindow";

export type ApprovalDependencyGraphInput = Readonly<{
  proposal: ProposalRecord;
  governanceView: ConstitutionalGovernanceView;
  replay: ReplayReconstructionResult;
  snapshots: readonly ConstitutionalSnapshotEnvelope[];
  generatedAt: string;
  ledger?: ApprovalDependencyLedger;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type ApprovalDependencyGraph = Readonly<{
  graphId: string;
  proposalId: string;
  nodes: readonly ApprovalDependencyNode[];
  inheritance: readonly ApprovalInheritanceRecord[];
  revocations: readonly ApprovalRevocationPropagation[];
  replay: ApprovalReplayBinding;
  timeWindows: readonly ApprovalTimeWindow[];
  lineage: ApprovalDependencyLedger;
  graphHash: string;
  replayHash: string;
  lineageHash: string;
  derivedOnly: true;
  valid: boolean;
  warnings: readonly string[];
  errors: readonly ApprovalLifecycleError[];
}>;
