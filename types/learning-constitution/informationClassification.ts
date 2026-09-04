import type { KnowledgeClassification, KnowledgeScope } from "./constitutionalVocabulary";

export const CLASSIFICATION_STATUSES = ["CLASSIFIED", "PROPOSED", "AMBIGUOUS"] as const;
export type ClassificationStatus = (typeof CLASSIFICATION_STATUSES)[number];

export const PROPOSED_DURABILITIES = [
  "NONE",
  "SESSION",
  "WORKSPACE",
  "DURABLE_CANDIDATE",
] as const;
export type ProposedDurability = (typeof PROPOSED_DURABILITIES)[number];

export const CLASSIFICATION_SOURCE_TYPES = [
  "OPERATOR_STATEMENT",
  "CONVERSATION",
  "AGENT_OUTPUT",
  "DOCUMENT",
  "REPOSITORY",
  "TOOL_RESULT",
  "EXTERNAL_SOURCE",
  "SYSTEM_CONFIGURATION",
] as const;
export type ClassificationSourceType = (typeof CLASSIFICATION_SOURCE_TYPES)[number];

export type ClassificationProvenance = Readonly<{
  observationId: string;
  sourceId: string;
  sourceType: ClassificationSourceType;
  originatingActorId: string;
  observedAt: string;
  correlationId?: string;
}>;

export type ClassificationReasoningMetadata = Readonly<{
  rationaleCode: string;
  matchedSignals: readonly string[];
  classifierId: string;
  classifierVersion: string;
}>;

export type ClassificationRelationshipHints = Readonly<{
  supersedesKnowledgeIds: readonly string[];
  exceptionToKnowledgeIds: readonly string[];
}>;

export type InformationClassificationRequest = Readonly<{
  content: string;
  provenance: ClassificationProvenance;
  scopeHint?: KnowledgeScope;
  relationshipHints?: Partial<ClassificationRelationshipHints>;
}>;

export type InformationClassificationResult = Readonly<{
  classification?: KnowledgeClassification;
  confidence: number;
  status: ClassificationStatus;
  proposedDurability: ProposedDurability;
  scopeHint?: KnowledgeScope;
  requiresValidation: boolean;
  provenance: ClassificationProvenance;
  reasoningMetadata: ClassificationReasoningMetadata;
  relationshipHints: ClassificationRelationshipHints;
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export interface InformationClassifier {
  classify(request: InformationClassificationRequest): Promise<InformationClassificationResult>;
}

export type ClassificationSemantics = Readonly<{
  description: string;
  defaultStatus: Exclude<ClassificationStatus, "AMBIGUOUS">;
  defaultDurability: ProposedDurability;
  requiresValidation: boolean;
}>;

export const CLASSIFICATION_SEMANTICS: Readonly<
  Record<KnowledgeClassification, ClassificationSemantics>
> = {
  CONVERSATION: {
    description: "Transient interaction context without durable-learning intent.",
    defaultStatus: "CLASSIFIED",
    defaultDurability: "NONE",
    requiresValidation: false,
  },
  BRAINSTORMING: {
    description: "Ideas explored without adoption or commitment.",
    defaultStatus: "PROPOSED",
    defaultDurability: "SESSION",
    requiresValidation: false,
  },
  SUGGESTION: {
    description: "A proposed course of action that is not an instruction or decision.",
    defaultStatus: "PROPOSED",
    defaultDurability: "SESSION",
    requiresValidation: false,
  },
  FACT: {
    description: "A descriptive claim asserted to be true.",
    defaultStatus: "CLASSIFIED",
    defaultDurability: "DURABLE_CANDIDATE",
    requiresValidation: true,
  },
  PREFERENCE: {
    description: "A non-mandatory tendency attributed to a subject and scope.",
    defaultStatus: "CLASSIFIED",
    defaultDurability: "DURABLE_CANDIDATE",
    requiresValidation: true,
  },
  INSTRUCTION: {
    description: "A directive that remains subject to authority, policy, scope, and safety.",
    defaultStatus: "CLASSIFIED",
    defaultDurability: "DURABLE_CANDIDATE",
    requiresValidation: true,
  },
  PROJECT_DECISION: {
    description: "A choice explicitly adopted within a project scope.",
    defaultStatus: "CLASSIFIED",
    defaultDurability: "DURABLE_CANDIDATE",
    requiresValidation: true,
  },
  PRINCIPLE: {
    description: "A durable guideline that influences reasoning or design.",
    defaultStatus: "CLASSIFIED",
    defaultDurability: "DURABLE_CANDIDATE",
    requiresValidation: true,
  },
  PROCEDURE: {
    description: "An established sequence describing how an operation is performed.",
    defaultStatus: "CLASSIFIED",
    defaultDurability: "DURABLE_CANDIDATE",
    requiresValidation: true,
  },
  CORRECTION: {
    description: "Information explicitly correcting or replacing earlier information.",
    defaultStatus: "CLASSIFIED",
    defaultDurability: "DURABLE_CANDIDATE",
    requiresValidation: true,
  },
  EXCEPTION: {
    description: "A scoped deviation from an otherwise applicable rule.",
    defaultStatus: "CLASSIFIED",
    defaultDurability: "DURABLE_CANDIDATE",
    requiresValidation: true,
  },
  AUTHORITATIVE_RULE: {
    description: "A potentially binding rule whose issuer authority must be validated.",
    defaultStatus: "CLASSIFIED",
    defaultDurability: "DURABLE_CANDIDATE",
    requiresValidation: true,
  },
};
