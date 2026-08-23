export type ConflictAdmissionGateResult = Readonly<{
  decision: "ALLOW" | "BLOCK";
  blockingConflictIds: readonly string[];
  reasonCode: "NO_BLOCKING_CONFLICT" | "UNRESOLVED_MATERIAL_CONFLICT";
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;
