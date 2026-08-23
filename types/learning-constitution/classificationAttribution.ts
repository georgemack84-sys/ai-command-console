import type { ClassificationProvenance } from "./informationClassification";

export const CLASSIFICATION_BASES = ["EXPLICIT", "INFERRED", "MANUAL_OVERRIDE"] as const;
export type ClassificationBasis = (typeof CLASSIFICATION_BASES)[number];

export const CLASSIFICATION_SPEAKER_TYPES = [
  "USER", "AGENT", "SYSTEM", "TOOL", "DOCUMENT", "EXTERNAL_SOURCE", "OTHER_AGENT",
] as const;
export type ClassificationSpeakerType = (typeof CLASSIFICATION_SPEAKER_TYPES)[number];

export type ClassificationAttribution = Readonly<{
  speakerType: ClassificationSpeakerType;
  speakerId: string;
  provenance: ClassificationProvenance;
  sourceReliabilityStatus: "NOT_EVALUATED";
  truthValidationStatus: "NOT_EVALUATED";
  authorityEffect: "UNCHANGED";
}>;
