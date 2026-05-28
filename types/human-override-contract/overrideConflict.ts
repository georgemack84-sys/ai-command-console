export type OverrideConflictType =
  | "ordering_conflict"
  | "freeze_resume_conflict"
  | "revoke_escalate_conflict"
  | "parent_chain_broken";

export type OverrideConflict = Readonly<{
  conflictId: string;
  type: OverrideConflictType;
  overrideIds: readonly string[];
  valid: boolean;
  reason: string;
}>;
