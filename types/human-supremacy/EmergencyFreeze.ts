export interface EmergencyFreeze {
  freezeId: string;
  freezeScope:
    | "proposal"
    | "coordination"
    | "escalation"
    | "governance"
    | "system-wide";
  initiatedBy: string;
  reason: string;
  activatedAt: string;
  replaySafe: true;
  governanceVisible: true;
  immutableAudit: true;
}
