import type { SourceRegistryEntry } from "../sources/sourceTypes";

export function SourceRegistryPanel({ sources }: { sources: SourceRegistryEntry[] }) {
  return (
    <section>
      <h2>Sources</h2>
      <ul>
        {sources.map((source) => (
          <li key={source.source_id}>{source.source_name}</li>
        ))}
      </ul>
    </section>
  );
}
