import {
  CLASSIFICATION_CONTEXT_MODES,
  CLASSIFICATION_CONTEXT_SOURCES,
  type ClassificationContextFrame,
  type ClassificationContextMode,
  type ClassificationContextWindow,
  type ClassificationContextWindowRequest,
} from "../../types/learning-constitution";

export const CLASSIFICATION_CONTEXT_PRIORITY = [...CLASSIFICATION_CONTEXT_SOURCES] as const;
export const DEFAULT_MAXIMUM_CLASSIFICATION_CONTEXT_FRAMES = 6;

const sourcePriority = (source: ClassificationContextFrame["source"]): number =>
  CLASSIFICATION_CONTEXT_PRIORITY.indexOf(source);
const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

const explicitModes = (content: string): readonly ClassificationContextMode[] => {
  if (/\bwe decided\b|\bdecided on\b/i.test(content)) return ["DECISION_CONTEXT"];
  if (/\b(?:let['’]s )?brainstorm\b/i.test(content)) return ["BRAINSTORM_CONTEXT"];
  if (/^hypothetically\b/i.test(content)) return ["HYPOTHETICAL_CONTEXT"];
  if (/^(?:for )?example\b/i.test(content)) return ["EXAMPLE_CONTEXT"];
  if (/\bplease review\b|\breview this\b/i.test(content)) return ["REVIEW_CONTEXT"];
  if (/\bremember that\b|\bteach(?:ing)?\b/i.test(content)) return ["TEACHING_CONTEXT"];
  return [];
};

/** Builds a bounded, priority-ordered context window without interpreting category or authority. */
export const buildConservativeClassificationContextWindow = (
  request: ClassificationContextWindowRequest,
): ClassificationContextWindow => {
  if (!isNonEmptyString(request.currentContent) || !Number.isInteger(request.maximumFrames) || request.maximumFrames < 0 ||
    request.frames.length > DEFAULT_MAXIMUM_CLASSIFICATION_CONTEXT_FRAMES) {
    throw new Error("classification context window request is invalid or exceeds the bounded limit");
  }
  const frameIds = new Set<string>();
  for (const frame of request.frames) {
    if (!isNonEmptyString(frame.frameId) || frameIds.has(frame.frameId) || !isNonEmptyString(frame.sourceId) || !isNonEmptyString(frame.content) ||
      !CLASSIFICATION_CONTEXT_SOURCES.includes(frame.source) || !frame.modes.every((mode: ClassificationContextMode) => CLASSIFICATION_CONTEXT_MODES.includes(mode))) {
      throw new Error("classification context frame is invalid");
    }
    frameIds.add(frame.frameId);
  }
  const currentModes = explicitModes(request.currentContent);
  const isDecision = currentModes.includes("DECISION_CONTEXT");
  const frames = [...request.frames]
    .sort((left, right) => sourcePriority(left.source) - sourcePriority(right.source))
    .slice(0, request.maximumFrames);
  const inheritedModes = frames.flatMap((frame) => frame.modes).filter((mode) => !isDecision || mode !== "BRAINSTORM_CONTEXT");
  const activeModes = [...new Set([...currentModes, ...inheritedModes])];
  return {
    currentContent: request.currentContent, frames, activeModes,
    reasonCodes: isDecision && request.frames.some((frame) => frame.modes.includes("BRAINSTORM_CONTEXT"))
      ? ["CURRENT_DECISION_OVERRIDES_BRAINSTORM_CONTEXT"] : currentModes.length > 0 ? ["EXPLICIT_CONTEXT_MARKER"] : ["BOUNDED_CONTEXT_WINDOW"],
    persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false,
  };
};
