import type { ClarificationResolution } from "./clarificationResolution";
import type { IntentResolutionState } from "./contextualResolution";

export type OperationalIntentResolutionResult = {
  intentId: string;
  originalInput: string;
  parsedIntent: {
    action: string;
    target: string;
    parameters: Record<string, unknown>;
  };
  normalizedIntent: {
    action: string;
    target: string;
    parameters: Record<string, unknown>;
  };
  semanticGovernance: {
    semanticallyValid: boolean;
    ambiguityDetected: boolean;
    governanceApproved: boolean;
    protectedTargetDetected: boolean;
    replayDriftDetected: boolean;
    freezeActive: boolean;
  };
  contextualResolution: {
    contextSufficient: boolean;
    missingContext: string[];
    conflictingContext: string[];
    unsafeAssumptions: string[];
  };
  clarification: ClarificationResolution;
  plannerAdmission: {
    admissible: boolean;
    denialReasons: string[];
    escalationRequired: boolean;
  };
  finalization: {
    finalized: boolean;
    operationalIntentHash: string;
    finalizedAt: number;
  };
  lineage: {
    parserVersion: string;
    semanticVersion: string;
    governanceVersion: string;
    resolutionVersion: string;
  };
  resolutionState: IntentResolutionState;
};

export const OPERATIONAL_INTENT_RESOLUTION_VERSION = "4.1E";
