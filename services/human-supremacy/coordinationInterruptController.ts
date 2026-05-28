import type { HumanSupremacyAction, HumanSupremacyState } from "@/types/human-supremacy";

export function resolveInterventionState(action: HumanSupremacyAction): HumanSupremacyState {
  switch (action) {
    case "pause_coordination":
      return "paused";
    case "revoke_proposal":
      return "revoked";
    case "freeze_escalation":
    case "emergency_freeze":
      return "frozen";
    case "deny_coordination":
      return "denied";
    case "override_coordination":
      return "override_enforced";
    case "inspect_rationale":
    case "inspect_replay_lineage":
    case "inspect_governance_lineage":
      return "inspection_only";
  }
}
