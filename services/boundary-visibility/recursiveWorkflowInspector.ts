import type { RecursiveWorkflowInspection } from "@/types/coordination-boundary-enforcement";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

export function inspectRecursiveWorkflow(input: {
  coordinationId: string;
  recursive: boolean;
  indicators: readonly string[];
}): RecursiveWorkflowInspection {
  const base = Object.freeze({
    coordinationId: input.coordinationId,
    recursive: input.recursive,
    indicators: Object.freeze([...input.indicators]),
  });
  return Object.freeze({
    ...base,
    inspectionHash: hashCoordinationReplayValue("coordination-boundary-recursive-inspection", base),
  });
}
