import type { AdvisoryReadModel } from "@/services/advisory/advisoryReadModel";
import { AdvisorySummaryPanel } from "./AdvisorySummaryPanel";
import { ConflictPanel } from "./ConflictPanel";
import { EvidencePanel } from "./EvidencePanel";
import { ReplayabilityPanel } from "./ReplayabilityPanel";
import { SourceBreakdownPanel } from "./SourceBreakdownPanel";

export function AdvisoryDashboard({ model }: { model: AdvisoryReadModel }) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8" data-testid="advisory-dashboard">
      <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase text-sky-200">Advisory Dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Advisory dashboard</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Unified advisory status, source risk, conflicts, evidence completeness, and replayability.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded border border-emerald-300/40 px-3 py-1 text-xs font-semibold text-emerald-100">READ_ONLY</span>
            <span className="rounded border border-amber-300/40 px-3 py-1 text-xs font-semibold text-amber-100">NO_CONTROL_AUTHORITY</span>
          </div>
        </div>
        <p className="mt-4 rounded border border-slate-500/40 bg-slate-900/60 px-3 py-2 text-sm text-slate-200">
          Operators may inspect advisory state. Operators must not control advisory state.
        </p>
      </section>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <AdvisorySummaryPanel model={model} />
        <SourceBreakdownPanel model={model} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <EvidencePanel model={model} />
        <ReplayabilityPanel model={model} />
      </div>

      <ConflictPanel model={model} />
    </main>
  );
}
