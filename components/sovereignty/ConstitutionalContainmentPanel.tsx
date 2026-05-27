export function ConstitutionalContainmentPanel(props: {
  containmentRequired: boolean;
  containmentState: string;
  frozenSystems: string[];
  disputedSystems: string[];
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
      <h3 className="text-lg font-semibold text-white">Constitutional containment</h3>
      <div className="mt-3 space-y-2 text-sm text-slate-300">
        <div className="flex items-center justify-between"><span>Containment required</span><span>{props.containmentRequired ? "Yes" : "No"}</span></div>
        <div className="flex items-center justify-between"><span>Containment state</span><span>{props.containmentState}</span></div>
        <div><span className="text-slate-400">Frozen systems:</span> {props.frozenSystems.length ? props.frozenSystems.join(", ") : "None"}</div>
        <div><span className="text-slate-400">Disputed systems:</span> {props.disputedSystems.length ? props.disputedSystems.join(", ") : "None"}</div>
      </div>
    </div>
  );
}
