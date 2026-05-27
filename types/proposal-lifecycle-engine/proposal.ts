import type { AutonomyReadinessProfile } from "@/types/autonomy-readiness";
import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import type { ConstitutionalSnapshotEnvelope } from "@/types/deterministic-snapshot-engine";
import type { ReplayReconstructionResult } from "@/types/replay-reconstruction-engine";
import type { SafeActionProfile } from "@/types/safe-action-catalog";
import type { ProposalApproval } from "./proposalApproval";
import type {
  ProposalGovernanceBinding,
  ProposalReplayBinding,
  ProposalSafeActionBinding,
  ProposalSnapshotBinding,
} from "./proposalBindings";
import type { ProposalLifecycleError } from "./proposalErrors";
import type { ProposalHandoffPackage } from "./proposalHandoff";
import type { ProposalLineageLedger } from "./proposalLineage";
import type { ProposalRevocation } from "./proposalRevocation";
import type { ProposalState, ProposalTransition } from "./proposalState";

export type ProposalLifecycleInput = Readonly<{
  proposalId: string;
  missionId: string;
  executionId: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  summary: string;
  currentState?: ProposalState;
  requestedTransition: ProposalTransition;
  readinessProfile: AutonomyReadinessProfile;
  safeActionProfile: SafeActionProfile;
  governanceView: ConstitutionalGovernanceView;
  replay: ReplayReconstructionResult;
  snapshots: readonly ConstitutionalSnapshotEnvelope[];
  metadata?: Readonly<Record<string, unknown>>;
  approval?: ProposalApproval;
  revocation?: ProposalRevocation;
  lineage?: ProposalLineageLedger;
}>;

export type ProposalRecord = Readonly<{
  proposalId: string;
  missionId: string;
  executionId: string;
  title: string;
  summary: string;
  currentState: ProposalState;
  requestedTransition: ProposalTransition;
  resultingState: ProposalState;
  lifecycleDecision: "ALLOW" | "DENY";
  createdAt: string;
  updatedAt: string;
  governanceBinding: ProposalGovernanceBinding;
  replayBinding: ProposalReplayBinding;
  snapshotBinding: ProposalSnapshotBinding;
  safeActionBinding: ProposalSafeActionBinding;
  approval: ProposalApproval;
  revocation: ProposalRevocation;
  lineage: ProposalLineageLedger;
  handoff?: ProposalHandoffPackage;
  warnings: readonly string[];
  errors: readonly ProposalLifecycleError[];
  proposalHash: string;
  immutable: true;
}>;
