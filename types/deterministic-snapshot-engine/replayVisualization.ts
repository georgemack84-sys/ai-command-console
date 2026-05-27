import type {
  AdaptationEnvelopeSnapshot,
  AuthorizationSnapshot,
  ConstitutionalSnapshotBuildInput,
  ConstitutionalSnapshotEnvelope,
  GovernanceDecisionRecord,
  RevocationSnapshot,
} from "./replayReconstruction";
import type { ConstitutionalSnapshotError } from "./replayLineageView";
import type { SnapshotIntegrityView } from "./replayDriftView";
import type { SnapshotLineageView } from "./replayComparisonView";
import type { ConstitutionalSnapshotVisualization } from "./replayIntegrityView";

export type ConstitutionalSnapshotAssembly = Readonly<{
  input: ConstitutionalSnapshotBuildInput;
  canonicalPayload: unknown;
  lineage: SnapshotLineageView;
  governanceHash: string;
  legalityHash: string;
  authorityHash: string;
  replayHash: string;
  payloadHash: string;
  schemaHash: string;
  integrityHash: string;
  integrity: SnapshotIntegrityView;
  visualization: ConstitutionalSnapshotVisualization;
  errors: readonly ConstitutionalSnapshotError[];
}>;

export type SnapshotPayloadFactories = Readonly<{
  governanceDecision?: GovernanceDecisionRecord;
  authorization?: AuthorizationSnapshot;
  revocation?: RevocationSnapshot;
  adaptation?: AdaptationEnvelopeSnapshot;
}>;

export type ConstitutionalSnapshotResult = Readonly<{
  snapshot: ConstitutionalSnapshotEnvelope;
  integrity: SnapshotIntegrityView;
  lineage: SnapshotLineageView;
  visualization: ConstitutionalSnapshotVisualization;
  errors: readonly ConstitutionalSnapshotError[];
}>;
