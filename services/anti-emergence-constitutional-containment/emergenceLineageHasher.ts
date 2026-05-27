import { hashEmergenceValue } from "./emergenceHashingEngine";

export function hashEmergenceLineage(scope: string, value: unknown): string {
  return hashEmergenceValue(`anti-emergence-lineage:${scope}`, value);
}
