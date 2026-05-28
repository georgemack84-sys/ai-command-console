export function SovereigntyStatusPanel(props: {
  sovereigntyState: string;
  constitutionalSafe: boolean;
  immutableAuditHealthy: boolean;
  unstableSystems: string[];
  frozenSystems: string[];
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
      <h3 className="text-lg font-semibold text-white">Sovereignty status</h3>
      <div className="mt-3 grid gap-2 text-sm text-slate-300">
        <div className="flex items-center justify-between"><span>State</span><span>{props.sovereigntyState}</span></div>
        <div className="flex items-center justify-between"><span>Constitutional safe</span><span>{props.constitutionalSafe ? "Yes" : "No"}</span></div>
        <div className="flex items-center justify-between"><span>Immutable audit healthy</span><span>{props.immutableAuditHealthy ? "Yes" : "No"}</span></div>
        <div><span className="text-slate-400">Unstable systems:</span> {props.unstableSystems.length ? props.unstableSystems.join(", ") : "None"}</div>
        <div><span className="text-slate-400">Frozen systems:</span> {props.frozenSystems.length ? props.frozenSystems.join(", ") : "None"}</div>
      </div>
    </div>
  );
}
