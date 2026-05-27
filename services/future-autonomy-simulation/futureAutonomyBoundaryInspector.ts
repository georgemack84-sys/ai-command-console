import type { FutureAutonomyBoundaryInspection } from "@/types/future-autonomy";
import { hashFutureAutonomyValue } from "./futureAutonomyHashEngine";

export function inspectFutureAutonomyBoundary(input: {
  topologyFrozen: boolean;
  isolationSafe: boolean;
}): FutureAutonomyBoundaryInspection {
  return Object.freeze({
    topologyFrozen: input.topologyFrozen,
    isolationSafe: input.isolationSafe,
    inspectionHash: hashFutureAutonomyValue("future-autonomy-boundary-inspection", input),
  });
}
