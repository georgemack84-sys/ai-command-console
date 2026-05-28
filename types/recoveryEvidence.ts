import type { RecoveryReadModel } from "./recoveryReadModel";
import type { RecoveryTimeline } from "./recoveryTimeline";

export type RecoveryEvidenceResult =
  | { ok: true; data: RecoveryEvidenceBundle }
  | { ok: false; error: "BLOCKED_UNSAFE_EVIDENCE_EXPORT" };

export type RecoveryEvidenceBundle = {
  executionId: string;
  readModel: RecoveryReadModel;
  timeline: RecoveryTimeline;
  state: "normal" | "disputed";
  sections: {
    execution: Record<string, unknown> | null;
    recovery: Record<string, unknown> | null;
    control: Record<string, unknown> | null;
    advisory: Record<string, unknown> | null;
    automation: Record<string, unknown> | null;
    autonomy: Record<string, unknown> | null;
    verification: Record<string, unknown> | null;
    learning: Record<string, unknown> | null;
    lock: Record<string, unknown> | null;
    ledger: Record<string, unknown> | null;
  };
  integrity: {
    hash: string;
    algorithm: "sha256";
    matchesReadModel: boolean;
  };
  meta: {
    completeness: "complete" | "partial";
    warnings: string[];
    version: "3.5D-2";
  };
};
