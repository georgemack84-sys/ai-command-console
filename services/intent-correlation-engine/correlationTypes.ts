import type { ApprovalDependencyGraph } from "@/types/approval-dependency-graph";
import type { ConstitutionalEscalationRecord } from "@/services/constitutional-escalation-layer";
import type { ConstitutionalAutonomyReadinessGateRecord } from "@/services/constitutional-autonomy-readiness-gate";
import type { IntentCoordinationGovernanceRecord } from "@/types/intent-coordination-governance-core";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { CorrelationLineageLedger, CorrelationResult } from "@/types/intent-correlation-engine";

export type CorrelateIntentProposalsInput = Readonly<{
  coordinationRecords: readonly IntentCoordinationGovernanceRecord[];
  proposals: readonly ProposalRecord[];
  approvalGraphs: readonly ApprovalDependencyGraph[];
  readinessGates: readonly ConstitutionalAutonomyReadinessGateRecord[];
  escalations: readonly ConstitutionalEscalationRecord[];
  createdAt: string;
  existingLineage?: CorrelationLineageLedger;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type CorrelationComputation = Readonly<{
  result: CorrelationResult;
  lineage: CorrelationLineageLedger;
  warnings: readonly string[];
  errors: readonly import("@/types/intent-correlation-engine").IntentCorrelationError[];
}>;
