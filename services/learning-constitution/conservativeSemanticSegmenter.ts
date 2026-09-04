import {
  type SemanticSegmentationRequest,
  type SemanticSegmentationResult,
  type SemanticUnit,
  type SemanticUnitSegmenter,
} from "../../types/learning-constitution";

export const CONSERVATIVE_SEMANTIC_SEGMENTER_ID = "semantic-unit-explicit-boundary-segmenter";
export const CONSERVATIVE_SEMANTIC_SEGMENTER_VERSION = "1.0.0";

const contextFor = (request: SemanticSegmentationRequest) => ({
  sourceMessageId: request.source.sourceId, speakerId: request.source.originatingActorId,
  ...(request.context?.conversationId ? { conversationId: request.context.conversationId } : {}),
  precedingContextReferences: request.context?.precedingContextReferences ?? [],
  followingContextReferences: request.context?.followingContextReferences ?? [],
});

const trimmedSpan = (sourceContent: string, start: number, end: number): Readonly<{ start: number; end: number; content: string }> => {
  let left = start;
  let right = end;
  while (left < right && /\s/.test(sourceContent[left])) left += 1;
  while (right > left && /\s/.test(sourceContent[right - 1])) right -= 1;
  return { start: left, end: right, content: sourceContent.slice(left, right) };
};

const rootUnit = (request: SemanticSegmentationRequest, content: string, sourceOrder: number, start = 0): SemanticUnit => ({
  semanticUnitId: `semantic-unit-${sourceOrder + 1}`, source: request.source, sourceOrder,
  textSpan: { start, end: start + content.length }, content, containment: "ROOT",
});

const sentenceRoots = (request: SemanticSegmentationRequest): readonly SemanticUnit[] => {
  const units: SemanticUnit[] = [];
  const boundary = /[^.!?]+[.!?]+|[^.!?]+$/g;
  for (const match of request.content.matchAll(boundary)) {
    const span = trimmedSpan(request.content, match.index ?? 0, (match.index ?? 0) + match[0].length);
    if (span.content) units.push(rootUnit(request, span.content, units.length, span.start));
  }
  return units;
};

const containedUnit = (
  request: SemanticSegmentationRequest,
  sourceOrder: number,
  parentSemanticUnitId: string,
  content: string,
  start: number,
  containment: "QUOTED" | "HYPOTHETICAL",
): SemanticUnit => ({
  semanticUnitId: `semantic-unit-${sourceOrder + 1}`, source: request.source, sourceOrder,
  textSpan: { start, end: start + content.length }, content, containment, parentSemanticUnitId,
});

/**
 * Segments only explicit sentence, quote, example, and hypothetical boundaries.
 * It deliberately leaves uncertain structures as one root unit rather than guessing.
 */
export const segmentSemanticUnitsConservatively = (
  request: SemanticSegmentationRequest,
): SemanticSegmentationResult => {
  if (!request.content.trim()) {
    return { source: request.source, sourceContent: request.content, units: [], status: "UNRESOLVED", reasonCodes: ["EMPTY_SOURCE"], context: contextFor(request), persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
  const exampleOrHypothetical = /^(?:for )?example\s*:|^hypothetically\s*,/i.test(request.content.trim());
  const roots = exampleOrHypothetical ? [rootUnit(request, request.content, 0)] : sentenceRoots(request);
  const units = [...roots];
  const root = roots[0];
  if (root && /^(?:for )?example\s*:/i.test(request.content.trim())) {
    for (const match of request.content.matchAll(/["“]([^"”]+)["”]/g)) {
      const content = match[1];
      const start = (match.index ?? 0) + 1;
      units.push(containedUnit(request, units.length, root.semanticUnitId, content, start, "QUOTED"));
    }
  }
  if (root && /^hypothetically\s*,/i.test(request.content.trim())) {
    const prefixEnd = request.content.search(/,/);
    const span = trimmedSpan(request.content, prefixEnd + 1, request.content.length);
    if (span.content) units.push(containedUnit(request, units.length, root.semanticUnitId, span.content, span.start, "HYPOTHETICAL"));
  }
  return { source: request.source, sourceContent: request.content, units, status: "SEGMENTED", reasonCodes: [exampleOrHypothetical ? "EXPLICIT_CONTAINMENT_BOUNDARY" : "EXPLICIT_SENTENCE_BOUNDARY"], context: contextFor(request), persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
};

export class ConservativeSemanticUnitSegmenter implements SemanticUnitSegmenter {
  segment(request: SemanticSegmentationRequest): SemanticSegmentationResult {
    return segmentSemanticUnitsConservatively(request);
  }
}
