import type { SamActionType } from "../sam/samTypes";
import type { Permission } from "./securityTypes";

export function getPermissionForSamAction(actionType: SamActionType): Permission {
  switch (actionType) {
    case "recover_execution":
      return "recovery:run";
    case "pause_execution":
    case "resume_execution":
    case "cancel_execution":
      return "execution:mutate";
    case "export_evidence":
      return "evidence:export";
    case "add_operator_note":
    case "inspect_state":
      return "execution:read";
    default:
      return "execution:read";
  }
}
