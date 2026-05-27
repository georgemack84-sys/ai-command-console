import type { MissionConsoleView } from "@/types/mission-intelligence-console";

export function MissionStatusHeader({ view }: { view: MissionConsoleView }) {
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-[0.28em] text-sky-200">Constitutional Mission Intelligence</p>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-semibold text-white">Mission Intelligence Console</h1>
          <p className="max-w-3xl text-sm text-slate-300">
            Replay-safe mission visibility across validation, governance, drift, snapshots, recovery, approval lineage, and autonomy readiness.
          </p>
        </div>
        <div className="space-y-1 text-right text-sm text-slate-300">
          <p>Mission: <span className="text-white">{view.missionId}</span></p>
          <p>Execution: <span className="text-white">{view.executionId}</span></p>
          <p>State: <span className={view.state === "DISPUTED" ? "text-amber-200" : "text-emerald-200"}>{view.state}</span></p>
        </div>
      </div>
    </div>
  );
}
