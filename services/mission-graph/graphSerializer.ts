import { normalizeMissionGraphValue } from "./graphNormalizer";

export function serializeMissionGraphValue(value: unknown): string {
  return JSON.stringify(normalizeMissionGraphValue(value as never));
}
