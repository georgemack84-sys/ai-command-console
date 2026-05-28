import type { IntentSource } from "./intentContracts";

export type CanonicalIntent = {
  intentId: string;
  action: string;
  target: string;
  parameters: Record<string, unknown>;
  semanticMeaning: string;
  confidence: number;
  source: IntentSource;
  ambiguities: string[];
  clarificationRequired: boolean;
  governanceRisk: "safe" | "review" | "restricted" | "blocked";
  supported: boolean;
  normalized: boolean;
  validation: {
    schemaValid: boolean;
    semanticValid: boolean;
    governanceValid: boolean;
    toolCompatible: boolean;
  };
  warnings: string[];
  createdAt: number;
};

export type SemanticResolutionResult = {
  valid: boolean;
  canonicalIntent: CanonicalIntent;
  blockedReasons: string[];
  warnings: string[];
};
