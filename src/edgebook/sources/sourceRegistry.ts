import type { SourceRegistryEntry } from "./sourceTypes";

export interface SourceRegistry {
  readonly sources: ReadonlyMap<string, SourceRegistryEntry>;
}

export function createSourceRegistry(sources: SourceRegistryEntry[]): SourceRegistry {
  return {
    sources: new Map(sources.map((source) => [source.source_id, { ...source }])),
  };
}

export function getRegisteredSource(
  registry: SourceRegistry,
  sourceId: string,
): SourceRegistryEntry | undefined {
  const source = registry.sources.get(sourceId);
  return source ? { ...source } : undefined;
}
