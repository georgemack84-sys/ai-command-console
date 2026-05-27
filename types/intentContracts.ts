export type IntentLifecycleState =
  | "RECEIVED"
  | "NORMALIZING"
  | "CLASSIFYING"
  | "VALIDATING"
  | "AMBIGUOUS"
  | "CLARIFICATION_REQUIRED"
  | "ACCEPTED"
  | "REJECTED"
  | "DISPUTED"
  | "FROZEN";

export type IntentActor = "system" | "user" | "operator";

export type IntentCategory =
  | "system"
  | "network"
  | "filesystem"
  | "runtime"
  | "diagnostics"
  | "governance"
  | "recovery"
  | "security"
  | "unknown";

export type IntentSource = "deterministic" | "ai" | "fallback";

export type StructuredIntent = {
  intentId: string;
  rawInput: string;
  normalizedInput: string;
  operationalIntent: string;
  category: IntentCategory;
  intent: {
    action: string;
    target: string;
    parameters: Record<string, unknown>;
  };
  confidence: number;
  source: IntentSource;
  ambiguities: string[];
  clarificationRequired: boolean;
  warnings: string[];
  supported: boolean;
  dangerous: boolean;
  semanticWarnings: string[];
  lifecycleState: IntentLifecycleState;
  replayHash: string;
  immutableHash: string;
  lineageId: string;
  semanticIntegrityVerified: boolean;
  createdAt: number;
  schemaVersion: string;
  taxonomyVersion: string;
  parserVersion: string;
};

export type IntentParserResult = {
  intent: {
    action: string;
    target: string;
    parameters: Record<string, unknown>;
  };
  confidence: number;
  source: IntentSource;
  ambiguities: string[];
  clarificationRequired: boolean;
  warnings: string[];
  lifecycleState: IntentLifecycleState;
  replayHash: string;
  immutableHash: string;
  lineageId: string;
  semanticIntegrityVerified: boolean;
};

export type ParserCandidate = {
  operationalIntent: string;
  category: IntentCategory;
  intent: IntentParserResult["intent"];
  confidence: number;
  source: IntentSource;
  ambiguities: string[];
  clarificationRequired: boolean;
  warnings: string[];
  supported: boolean;
  dangerous: boolean;
  semanticWarnings: string[];
};

export type IntentLifecycleEvent = {
  eventId: string;
  intentId: string;
  previousState?: IntentLifecycleState;
  nextState: IntentLifecycleState;
  actor: IntentActor;
  timestamp: number;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
};

export type IntentLineage = {
  lineageId: string;
  replayOf?: string;
  derivedFrom?: string;
  parentIntentId?: string;
};

export type IntentReplayInspection = {
  intentId: string;
  deterministic: boolean;
  driftDetected: boolean;
  reasons: string[];
  lifecycleHash: string;
  reconstructedState: IntentLifecycleState | "MISSING";
};

export type IntentIntegrityReport = {
  intentId: string;
  valid: boolean;
  reasons: string[];
  duplicateTransitions: boolean;
  timestampCorruption: boolean;
  orphaned: boolean;
};

export const INTENT_ERROR_CODES = {
  INVALID_INPUT: "INVALID_INPUT",
  LOW_CONFIDENCE: "LOW_CONFIDENCE",
  AMBIGUOUS_TARGET: "AMBIGUOUS_TARGET",
  SEMANTIC_CONFLICT: "SEMANTIC_CONFLICT",
  UNSUPPORTED_OPERATION: "UNSUPPORTED_OPERATION",
  NORMALIZATION_FAILURE: "NORMALIZATION_FAILURE",
  SCHEMA_VALIDATION_FAILED: "SCHEMA_VALIDATION_FAILED",
  AI_VALIDATION_FAILED: "AI_VALIDATION_FAILED",
  TAXONOMY_VALIDATION_FAILED: "TAXONOMY_VALIDATION_FAILED",
  INTENT_REPLAY_FAILED: "INTENT_REPLAY_FAILED",
  INTENT_SEMANTIC_DRIFT: "INTENT_SEMANTIC_DRIFT",
  INTENT_TAXONOMY_CORRUPTED: "INTENT_TAXONOMY_CORRUPTED",
  INTENT_AUDIT_CORRUPTED: "INTENT_AUDIT_CORRUPTED",
  INTENT_CONFIDENCE_DRIFT: "INTENT_CONFIDENCE_DRIFT",
  INTENT_IMMUTABLE_MUTATION: "INTENT_IMMUTABLE_MUTATION",
  INTENT_LINEAGE_CORRUPTED: "INTENT_LINEAGE_CORRUPTED",
  INTENT_VALIDATION_DRIFT: "INTENT_VALIDATION_DRIFT",
  INTENT_REPLAY_MISMATCH: "INTENT_REPLAY_MISMATCH",
  INTENT_FROZEN: "INTENT_FROZEN",
  INTENT_INTEGRITY_FAILURE: "INTENT_INTEGRITY_FAILURE",
  INTENT_NOT_FOUND: "INTENT_NOT_FOUND",
  INTENT_TRANSITION_DENIED: "INTENT_TRANSITION_DENIED",
  INTENT_STATE_MISMATCH: "INTENT_STATE_MISMATCH",
  INTENT_SCHEMA_INVALID: "INTENT_SCHEMA_INVALID",
  INTENT_SEMANTIC_INVALID: "INTENT_SEMANTIC_INVALID",
  INTENT_UNSUPPORTED: "INTENT_UNSUPPORTED",
  INTENT_AMBIGUOUS: "INTENT_AMBIGUOUS",
  INTENT_GOVERNANCE_BLOCKED: "INTENT_GOVERNANCE_BLOCKED",
  INTENT_TOOL_UNAVAILABLE: "INTENT_TOOL_UNAVAILABLE",
  INTENT_CONTEXT_INSUFFICIENT: "INTENT_CONTEXT_INSUFFICIENT",
  INTENT_CONFIDENCE_TOO_LOW: "INTENT_CONFIDENCE_TOO_LOW",
  INTENT_NORMALIZATION_FAILED: "INTENT_NORMALIZATION_FAILED",
  INTENT_RESOLUTION_FAILED: "INTENT_RESOLUTION_FAILED",
} as const;
