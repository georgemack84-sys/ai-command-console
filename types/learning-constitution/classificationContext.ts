export const CLASSIFICATION_CONTEXT_SOURCES = [
  "CURRENT_EXPLICIT_STATEMENT",
  "EXPLICIT_REFERENCE_TARGET",
  "IMMEDIATE_CONVERSATION",
  "ACTIVE_PROJECT_CONTEXT",
  "DURABLE_KNOWLEDGE",
  "HISTORICAL_CONVERSATION",
] as const;
export type ClassificationContextSource = (typeof CLASSIFICATION_CONTEXT_SOURCES)[number];

export const CLASSIFICATION_CONTEXT_MODES = [
  "BRAINSTORM_CONTEXT", "DECISION_CONTEXT", "REVIEW_CONTEXT", "TEACHING_CONTEXT", "HYPOTHETICAL_CONTEXT", "EXAMPLE_CONTEXT",
] as const;
export type ClassificationContextMode = (typeof CLASSIFICATION_CONTEXT_MODES)[number];

export type ClassificationContextFrame = Readonly<{
  frameId: string;
  source: ClassificationContextSource;
  sourceId: string;
  modes: readonly ClassificationContextMode[];
  content: string;
}>;

export type ClassificationContextWindowRequest = Readonly<{
  currentContent: string;
  frames: readonly ClassificationContextFrame[];
  maximumFrames: number;
}>;

export type ClassificationContextWindow = Readonly<{
  currentContent: string;
  frames: readonly ClassificationContextFrame[];
  activeModes: readonly ClassificationContextMode[];
  reasonCodes: readonly string[];
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export type ContextualClassificationInputRequest = Readonly<{
  source: ClassificationProvenance;
  content: string;
  contextFrames: readonly ClassificationContextFrame[];
  maximumContextFrames: number;
  explicitUserCategory?: import("./canonicalTaxonomy").CanonicalInformationCategory;
  explicitLearningIntent?: "EXPLICIT_LEARNING" | "EXPLICIT_NON_LEARNING";
}>;

export type ContextualCanonicalInputClassificationResult = Readonly<{
  context: ClassificationContextWindow;
  classification: CanonicalInputClassificationResult;
  attribution: import("./classificationAttribution").ClassificationAttribution;
  controls: import("./classificationControls").ClassificationControlAssessment;
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;
import type { ClassificationProvenance } from "./informationClassification";
import type { CanonicalInputClassificationResult } from "./canonicalClassification";
