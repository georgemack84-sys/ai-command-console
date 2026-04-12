type DiagnosticLevel = "info" | "warn" | "error";

export type RuntimeDiagnosticEntry = {
  id: string;
  scope: string;
  level: DiagnosticLevel;
  message: string;
  timestamp: string;
  traceId?: string | null;
  context?: Record<string, unknown>;
};

const MAX_RUNTIME_DIAGNOSTICS = 200;
const diagnosticsBuffer: RuntimeDiagnosticEntry[] = [];

function nextDiagnosticId() {
  return `diag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeDiagnosticValue(value: unknown, depth = 0): unknown {
  if (depth >= 2) {
    if (Array.isArray(value)) {
      return `[${value.length} items]`;
    }

    if (value && typeof value === "object") {
      return "[object]";
    }

    return value;
  }

  if (typeof value === "string") {
    return value.length > 240 ? `${value.slice(0, 237)}...` : value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 8).map((item) => sanitizeDiagnosticValue(item, depth + 1));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 12)
        .map(([key, item]) => [key, sanitizeDiagnosticValue(item, depth + 1)]),
    );
  }

  return value;
}

function sanitizeDiagnosticContext(context?: Record<string, unknown>) {
  if (!context || typeof context !== "object") {
    return context;
  }

  return sanitizeDiagnosticValue(context, 0) as Record<string, unknown>;
}

export function recordRuntimeDiagnostic(input: {
  scope: string;
  level: DiagnosticLevel;
  message: string;
  traceId?: string | null;
  context?: Record<string, unknown>;
}) {
  diagnosticsBuffer.push({
    id: nextDiagnosticId(),
    scope: input.scope,
    level: input.level,
    message: input.message,
    timestamp: new Date().toISOString(),
    traceId: input.traceId ?? (typeof input.context?.traceId === "string" ? input.context.traceId : null),
    context: sanitizeDiagnosticContext(input.context),
  });

  if (diagnosticsBuffer.length > MAX_RUNTIME_DIAGNOSTICS) {
    diagnosticsBuffer.splice(0, diagnosticsBuffer.length - MAX_RUNTIME_DIAGNOSTICS);
  }
}

export function listRuntimeDiagnostics(limit = 20, scope?: string) {
  const items = scope
    ? diagnosticsBuffer.filter((entry) => entry.scope === scope)
    : diagnosticsBuffer;

  return items.slice(-Math.max(1, limit)).reverse();
}

export function summarizeRuntimeDiagnostics(limit = 100, scopes?: string[]) {
  const source = scopes?.length
    ? diagnosticsBuffer.filter((entry) => scopes.includes(entry.scope))
    : diagnosticsBuffer;
  const items = source.slice(-Math.max(1, limit));

  return items.reduce(
    (summary, entry) => {
      summary.total += 1;
      if (entry.level === "error") {
        summary.errors += 1;
      } else if (entry.level === "warn") {
        summary.warnings += 1;
      }
      summary.byScope[entry.scope] = (summary.byScope[entry.scope] || 0) + 1;
      summary.latestAt = entry.timestamp;
      return summary;
    },
    {
      total: 0,
      errors: 0,
      warnings: 0,
      byScope: {} as Record<string, number>,
      latestAt: null as string | null,
    },
  );
}

export function __clearRuntimeDiagnosticsForTests() {
  diagnosticsBuffer.splice(0, diagnosticsBuffer.length);
}
