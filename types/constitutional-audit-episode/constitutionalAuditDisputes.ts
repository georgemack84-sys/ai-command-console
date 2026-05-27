import type { ConstitutionalAuditSeverity } from "./constitutionalAuditSeverity";

export type ConstitutionalDisputeRecord = Readonly<{
  disputeId: string;
  episodeId: string;
  state: "open" | "frozen";
  category:
    | "REPLAY"
    | "GOVERNANCE"
    | "APPROVAL"
    | "ESCALATION"
    | "LINEAGE"
    | "OPERATOR"
    | "VALIDATOR";
  severity: ConstitutionalAuditSeverity;
  evidenceRefs: readonly string[];
  createdAt: string;
  deterministicHash: string;
}>;
