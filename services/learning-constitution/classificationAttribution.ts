import type { ClassificationAttribution, ClassificationProvenance } from "../../types/learning-constitution";

const speakerTypeBySource = {
  OPERATOR_STATEMENT: "USER",
  CONVERSATION: "USER",
  AGENT_OUTPUT: "AGENT",
  DOCUMENT: "DOCUMENT",
  REPOSITORY: "DOCUMENT",
  TOOL_RESULT: "TOOL",
  EXTERNAL_SOURCE: "EXTERNAL_SOURCE",
  SYSTEM_CONFIGURATION: "SYSTEM",
} as const;

export const resolveClassificationAttribution = (
  provenance: ClassificationProvenance,
): ClassificationAttribution => ({
  speakerType: speakerTypeBySource[provenance.sourceType], speakerId: provenance.originatingActorId, provenance,
  sourceReliabilityStatus: "NOT_EVALUATED", truthValidationStatus: "NOT_EVALUATED", authorityEffect: "UNCHANGED",
});
