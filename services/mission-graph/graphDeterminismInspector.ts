import type { MissionGraphError, MissionGraphSnapshot } from "@/types/mission-graph";
import { serializeMissionGraphValue } from "./graphSerializer";
import { hashMissionGraphValue } from "./graphHasher";
import { createMissionGraphError } from "./graphBoundaryEnforcer";

export function inspectMissionGraphDeterminism(snapshot: MissionGraphSnapshot): readonly MissionGraphError[] {
  const firstSerialization = serializeMissionGraphValue(snapshot);
  const secondSerialization = serializeMissionGraphValue(snapshot);
  const firstHash = hashMissionGraphValue("mission-graph-determinism", snapshot);
  const secondHash = hashMissionGraphValue("mission-graph-determinism", snapshot);
  if (firstSerialization === secondSerialization && firstHash === secondHash) {
    return Object.freeze([]);
  }
  return Object.freeze([
    createMissionGraphError(
      "MISSION_GRAPH_NON_DETERMINISTIC_OUTPUT",
      "Mission graph output changed across deterministic inspection.",
      "snapshot",
    ),
  ]);
}
