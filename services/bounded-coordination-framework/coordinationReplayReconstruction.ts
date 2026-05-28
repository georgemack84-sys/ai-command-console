import type { CoordinationTopologyGraph } from "@/types/bounded-coordination-framework";
import { normalizeCoordinationTopologyValue } from "./coordinationTopologyNormalizer";

export function reconstructCoordinationReplay(graph: CoordinationTopologyGraph): CoordinationTopologyGraph {
  return Object.freeze(normalizeCoordinationTopologyValue(graph));
}
