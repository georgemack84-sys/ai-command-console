import type { DeploymentHardeningReadModel } from "@/services/deployment-hardening/deploymentHardeningReadModel";

export function TelemetryTimeline({ model }: { model: DeploymentHardeningReadModel }) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/70 p-5" data-testid="telemetry-timeline">
      <p className="text-xs uppercase text-sky-200">Telemetry Timeline</p>
      <h2 className="mt-1 text-xl font-semibold text-white">{model.timeline.length} ordered events</h2>
      <ol className="mt-5 space-y-3">
        {model.timeline.length ? model.timeline.map((event, index) => (
          <li key={`${event.timestamp || "no-time"}-${event.event}-${index}`} className="rounded border border-slate-800 bg-slate-900/50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-semibold text-white">{event.event}</span>
              <span className="text-slate-400">{event.timestamp || "No timestamp"}</span>
            </div>
            <p className="mt-1 text-sm text-slate-300">
              {event.currentStep || "unknown step"} - {event.state} - {event.deploymentDecision}/{event.deploymentRisk}
            </p>
          </li>
        )) : (
          <li className="rounded border border-amber-400/40 bg-amber-950/30 p-3 text-sm text-amber-100">
            No telemetry events are available.
          </li>
        )}
      </ol>
    </section>
  );
}
