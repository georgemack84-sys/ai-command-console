import type { ClassificationProvenance } from "./informationClassification";

export const SEMANTIC_UNIT_CONTAINMENTS = ["ROOT", "QUOTED", "EXAMPLE", "HYPOTHETICAL"] as const;
export type SemanticUnitContainment = (typeof SEMANTIC_UNIT_CONTAINMENTS)[number];

export const SEMANTIC_SEGMENTATION_STATUSES = ["SEGMENTED", "UNRESOLVED"] as const;
export type SemanticSegmentationStatus = (typeof SEMANTIC_SEGMENTATION_STATUSES)[number];

export type SemanticTextSpan = Readonly<{
  start: number;
  end: number;
}>;

export type SemanticSegmentationContext = Readonly<{
  sourceMessageId: string;
  speakerId: string;
  conversationId?: string;
  precedingContextReferences: readonly string[];
  followingContextReferences: readonly string[];
}>;

export type SemanticUnit = Readonly<{
  semanticUnitId: string;
  source: ClassificationProvenance;
  sourceOrder: number;
  textSpan: SemanticTextSpan;
  content: string;
  containment: SemanticUnitContainment;
  parentSemanticUnitId?: string;
}>;

export type SemanticSegmentationResult = Readonly<{
  source: ClassificationProvenance;
  sourceContent: string;
  units: readonly SemanticUnit[];
  status: SemanticSegmentationStatus;
  reasonCodes: readonly string[];
  context: SemanticSegmentationContext;
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export type SemanticSegmentationRequest = Readonly<{
  source: ClassificationProvenance;
  content: string;
  context?: Readonly<{ conversationId?: string; precedingContextReferences?: readonly string[]; followingContextReferences?: readonly string[] }>;
}>;

export interface SemanticUnitSegmenter {
  segment(request: SemanticSegmentationRequest): SemanticSegmentationResult;
}
