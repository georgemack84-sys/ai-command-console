import type { RecoveryEvidenceBundle } from "./recoveryEvidence";
import type { OperatorView } from "./recoveryOperatorApi";

export type DashboardState = {
  executionId: string;
  operatorView: OperatorView;
  evidence: RecoveryEvidenceBundle | null;
  loading: boolean;
  error?: string;
};

export type SystemState = "normal" | "disputed" | "partial" | "unknown";

