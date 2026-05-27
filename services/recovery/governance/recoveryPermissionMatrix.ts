export function getRequiredRecoveryPermission(action: string) {
  switch (action) {
    case "replay":
      return "recovery:replay";
    case "rollback":
      return "recovery:rollback";
    case "reassign":
      return "recovery:reassign";
    case "terminate":
      return "recovery:terminate";
    case "quarantine":
      return "recovery:quarantine";
    default:
      return "recovery:override";
  }
}
