import type { AdvisoryReadModel } from "@/services/advisory/advisoryReadModel";

export function ConflictPanel({ model }: { model: AdvisoryReadModel }) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/70 p-5" data-testid="conflict-panel">
      <p className="text-xs uppercase text-sky-200">Conflicts</p>
      {model.conflicts.length === 0 ? (
        <p className="mt-3 text-sm text-slate-300">No advisory conflicts detected.</p>
      ) : (
        <ul className="mt-4 space-y-2 text-sm text-amber-100">
          {model.conflicts.map((conflict) => (
            <li className="rounded border border-amber-400/40 bg-amber-950/30 px-3 py-2" key={`${conflict.source}:${conflict.reason}`}>
              <span className="font-semibold">{conflict.source}</span>: {conflict.reason}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
