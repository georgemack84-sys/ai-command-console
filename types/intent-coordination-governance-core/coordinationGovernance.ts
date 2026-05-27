import type { CoordinationBoundaryContract, CoordinationContainment } from "./coordinationContainment";
import type { CoordinationGovernanceError } from "./coordinationErrors";
import type { CoordinationEscalationGovernance } from "./coordinationEscalation";
import type { CoordinationLineageLedger } from "./coordinationLineage";
import type { CoordinationReplayBinding } from "./coordinationReplay";
import type { CoordinationState } from "./coordinationState";
import type { IntentCoordinationTopology } from "./coordinationTopology";
import type { CoordinationValidation } from "./coordinationValidation";

export type CoordinationGovernanceSchema = Readonly<{
  schemaId: string;
  governanceSnapshotHash: string;
  readinessCertificationId: string;
  readinessLevel: string;
  allowedRelationshipTypes: readonly string[];
  forbiddenTopologyPatterns: readonly string[];
  executionAuthority: false;
  replaySafe: true;
  createdAt: string;
}>;

export type CoordinationAuditEvent = Readonly<{
  eventId: string;
  coordinationId: string;
  eventType: "relationship_validated" | "containment_validated" | "transition_resolved" | "replay_bound";
  eventHash: string;
  createdAt: string;
}>;

export type IntentCoordinationGovernanceRecord = Readonly<{
  coordinationId: string;
  state: CoordinationState;
  governanceSchema: CoordinationGovernanceSchema;
  topology: IntentCoordinationTopology;
  boundaryContract: CoordinationBoundaryContract;
  escalationGovernance: CoordinationEscalationGovernance;
  containment: CoordinationContainment;
  validation: CoordinationValidation;
  replayBinding: CoordinationReplayBinding;
  lineage: CoordinationLineageLedger;
  auditEvents: readonly CoordinationAuditEvent[];
  warnings: readonly string[];
  errors: readonly CoordinationGovernanceError[];
  coordinationHash: string;
  derivedOnly: true;
}>;
