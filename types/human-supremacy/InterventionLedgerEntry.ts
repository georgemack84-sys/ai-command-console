export type InterventionLedgerEntry = Readonly<{
  entryId: string;
  coordinationId: string;
  action:
    | "pause_coordination"
    | "revoke_proposal"
    | "freeze_escalation"
    | "deny_coordination"
    | "inspect_rationale"
    | "inspect_replay_lineage"
    | "inspect_governance_lineage"
    | "override_coordination"
    | "emergency_freeze";
  overrideId?: string;
  freezeId?: string;
  replayHash: string;
  governanceHash: string;
  createdAt: string;
}>;
