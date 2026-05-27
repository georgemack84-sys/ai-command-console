export const INTENT_SCHEMA_VERSION = "4.1A";
export const INTENT_TAXONOMY_VERSION = "4.1A";
export const INTENT_PARSER_VERSION = "4.1A";

export const INTENT_CONFIDENCE = {
  deterministicAccept: 0.85,
  aiAccept: 0.78,
  minimumAccepted: 0.75,
  clarificationThreshold: 0.7,
} as const;

export const INTENT_ALIAS_NORMALIZATION: Record<string, string> = {
  "log files": "logs",
  "service status": "service",
  "runtime status": "runtime",
  "network port": "port",
  "governance freeze": "freeze",
};
