export interface AuditTrailEntry {
  audit_id: string;
  operation: string;
  input_reference: string;
  output_reference: string;
  timestamp: string;
}

export function createAuditTrail(initialEntries: AuditTrailEntry[] = []) {
  const entries = initialEntries.map((entry) => ({ ...entry }));

  return {
    record(entry: AuditTrailEntry) {
      entries.push({ ...entry });
      return { status: "RECORDED" as const, entry: { ...entry } };
    },
    list() {
      return entries.map((entry) => ({ ...entry }));
    },
  };
}
