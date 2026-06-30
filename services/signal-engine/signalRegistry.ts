import type { SignalRegistry, SignalRegistryEntry, SignalType } from "./types";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function entry(signalType: SignalType, requiredEvidence: string[], enabled = true): SignalRegistryEntry {
  return Object.freeze({
    signalType,
    enabled,
    requiredEvidence: [...requiredEvidence].sort(),
    recommendationAllowed: false,
  });
}

export function createSignalRegistry(
  overrides: Partial<Record<SignalType, Partial<SignalRegistryEntry>>> = {},
  registryVersion = "signal-registry/v1",
): SignalRegistry {
  const baseEntries: Record<SignalType, SignalRegistryEntry> = {
    STEAM_MOVEMENT: entry("STEAM_MOVEMENT", ["movement_events_used", "observations_used"]),
    REVERSE_LINE_MOVEMENT: entry("REVERSE_LINE_MOVEMENT", ["movement_events_used"]),
    CONSENSUS_DIVERGENCE: entry("CONSENSUS_DIVERGENCE", ["movement_events_used", "observations_used"]),
    VOLATILITY_SPIKE: entry("VOLATILITY_SPIKE", ["movement_events_used"]),
    IMPLIED_PROBABILITY_SHIFT: entry("IMPLIED_PROBABILITY_SHIFT", ["movement_events_used"]),
    UNCLASSIFIED: entry("UNCLASSIFIED", ["movement_events_used"]),
  };

  const entries = Object.fromEntries(
    Object.entries(baseEntries).map(([signalType, baseEntry]) => {
      const patch = overrides[signalType as SignalType];
      return [
        signalType,
        Object.freeze({
          ...baseEntry,
          ...patch,
          signalType,
          requiredEvidence: [...(patch?.requiredEvidence ?? baseEntry.requiredEvidence)].sort(),
          recommendationAllowed: false,
        }),
      ];
    }),
  ) as Record<SignalType, SignalRegistryEntry>;

  return Object.freeze({
    registryVersion,
    entries,
  });
}

export function getSignalRegistryEntry(registry: SignalRegistry, signalType: SignalType): SignalRegistryEntry | undefined {
  const entry = registry.entries[signalType];
  return entry ? clone(entry) : undefined;
}

export function isKnownSignalType(registry: SignalRegistry, signalType: string): signalType is SignalType {
  return signalType in registry.entries;
}
