export type ConfidenceLineage = {
  sourceSystem: string;
  derivedFrom: string[];
  inheritedConstraints: string[];
  disputedSignals: string[];
};

export function buildConfidenceLineage(input: ConfidenceLineage): ConfidenceLineage {
  return {
    sourceSystem: input.sourceSystem,
    derivedFrom: Array.from(new Set(input.derivedFrom)),
    inheritedConstraints: Array.from(new Set(input.inheritedConstraints)),
    disputedSignals: Array.from(new Set(input.disputedSignals)),
  };
}
