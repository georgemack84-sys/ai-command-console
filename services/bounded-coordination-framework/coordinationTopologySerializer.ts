import { normalizeCoordinationTopologyValue } from "./coordinationTopologyNormalizer";

export function serializeCoordinationTopologyValue(value: unknown): string {
  return JSON.stringify(normalizeCoordinationTopologyValue(value));
}
