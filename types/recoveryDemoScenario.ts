export type RecoveryDemoScenario = {
  scenarioId: string;
  title: string;
  description: string;
  executionId: string;

  seed: {
    execution?: Record<string, unknown>;
    lock?: Record<string, unknown>;
    ledger?: Record<string, unknown>[];
    recovery?: Record<string, unknown>[];
    control?: Record<string, unknown>[];
    advisory?: Record<string, unknown>[];
    automation?: Record<string, unknown>[];
    autonomy?: Record<string, unknown>[];
    verification?: Record<string, unknown>[];
    learning?: Record<string, unknown>[];
  };

  expected: {
    readModel?: Record<string, unknown>;
    timeline?: Record<string, unknown>;
    evidence?: Record<string, unknown>;
    operatorActions?: string[];
    dashboardState?: {
      systemState: "normal" | "disputed" | "partial" | "unknown";
      evidenceVisible: boolean;
      exportVisible: boolean;
      mutatingActionsFrozen: boolean;
      addNoteAvailable: boolean;
    };
  };
};

export type RecoveryDemoScenarioReport = {
  scenarioId: string;
  executionId: string;
  ok: boolean;

  readModelSummary: {
    recoveryStatus?: string;
    verificationStatus?: string;
    advisoryStatus?: string;
    operatorAttention?: boolean;
  };

  timelineSummary: {
    totalEvents: number;
    matchesReadModel: boolean;
  };

  evidenceSummary: {
    state: "normal" | "disputed";
    hash?: string;
    warnings: string[];
  };

  operatorSummary: {
    allowed: string[];
    blocked: {
      action: string;
      reason?: string;
    }[];
  };

  dashboardSummary?: {
    systemState: "normal" | "disputed" | "partial" | "unknown";
    evidenceVisible: boolean;
    exportVisible: boolean;
    mutatingActionsFrozen: boolean;
    addNoteAvailable: boolean;
  };

  assertions: {
    name: string;
    passed: boolean;
    expected: unknown;
    actual: unknown;
  }[];
};

export type RecoveryDemoScenarioResult =
  | {
      ok: true;
      data: RecoveryDemoScenarioReport;
    }
  | {
      ok: false;
      error: "BLOCKED_UNSAFE_DEMO_SCENARIO";
      warnings?: string[];
    };
