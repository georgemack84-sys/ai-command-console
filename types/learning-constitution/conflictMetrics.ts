/** Read-only operational measures derived from immutable conflict artifacts. */
export type ConflictMetrics = Readonly<{
  conflictsDetected: number;
  conflictsResolved: number;
  conflictsPending: number;
  conflictsEscalated: number;
  clarificationsRequested: number;
  candidatesRejected: number;
  itemsSuperseded: number;
  exceptionsCreated: number;
  scopeNarrowings: number;
  mergesCompleted: number;
  humanResolutions: number;
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;
