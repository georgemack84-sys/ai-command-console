import type { ExecutorConstraints } from "./executorConstraints";
import type {
  ExecutionTreatyHandoffStatus,
  ExecutionTreatyPreExecutionRevocationStatus,
  ExecutionTreatyTrustZone,
} from "./executionTreatyStatus";

export type ExecutionTreatyManifest = Readonly<{
  handoffId: string;
  treatyId: string;
  planId: string;
  planHash: string;
  executionTruthHash: string;
  executionCompatibilityHash: string;
  replaySnapshotHash: string;
  replayBindingHash: string;
  derivedSimulationHash: string;
  derivedAdmissionHash: string;
  registrySnapshotHash: string;
  governanceSnapshotHash: string;
  approvalChainHash: string;
  provenanceHash: string;
  signatureHash: string;
  survivabilityHash: string;
  forensicReplayHash: string;
  governanceInheritanceHash: string;
  trustZone: ExecutionTreatyTrustZone;
  handoffStatus: ExecutionTreatyHandoffStatus;
  preExecutionRevocationStatus: ExecutionTreatyPreExecutionRevocationStatus;
  executorConstraints: ExecutorConstraints;
  executionStarted: false;
  dispatchPerformed: false;
  createdAt: string;
  createdBy: string;
}>;
