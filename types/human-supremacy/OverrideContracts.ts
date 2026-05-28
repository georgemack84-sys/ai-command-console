export interface HumanSupremacyAuthorityContract {
  executionAuthority: false;
  orchestrationAuthority: false;
  schedulingAuthority: false;
  governanceMutationAuthority: false;
  approvalInheritance: false;
  authorityInheritance: false;
  autonomousIntervention: false;
  selfResumeAuthority: false;
  selfRecoveryAuthority: false;
  runtimeMutationAuthority: false;
}

export type HumanSupremacyAction =
  | "pause_coordination"
  | "revoke_proposal"
  | "freeze_escalation"
  | "deny_coordination"
  | "inspect_rationale"
  | "inspect_replay_lineage"
  | "inspect_governance_lineage"
  | "override_coordination"
  | "emergency_freeze";
