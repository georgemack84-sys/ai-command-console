const auditKey = "axiom-time:audit";
const maxAuditEntries = 200;

export interface AuditEvent {
  action: string;
  at: string;
  detail?: string;
}

export const recordAudit = (action: string, detail?: string) => {
  let events: AuditEvent[] = [];
  try {
    const raw = window.localStorage.getItem(auditKey);
    const existing: AuditEvent[] = raw ? JSON.parse(raw) : [];
    events = Array.isArray(existing) ? existing : [];
  } catch {
    // A corrupt historical log is discarded; this new event is still useful.
  }
  try {
    events.push({ action, at: new Date().toISOString(), detail });
    window.localStorage.setItem(
      auditKey,
      JSON.stringify(events.slice(-maxAuditEntries)),
    );
  } catch {
    // Auditing must never prevent a user from managing their time.
  }
};
