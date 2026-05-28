export function CivilizationContinuityPanel(props: {
  continuityState: string;
  continuityProjection: number;
  protectedDomains: string[];
  isolatedDomains: string[];
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
      <h3 className="text-lg font-semibold text-white">Civilization continuity</h3>
      <div className="mt-3 space-y-2 text-sm text-slate-300">
        <div className="flex items-center justify-between"><span>Continuity state</span><span>{props.continuityState}</span></div>
        <div className="flex items-center justify-between"><span>Continuity projection</span><span>{Math.round(props.continuityProjection * 100)}%</span></div>
        <div><span className="text-slate-400">Protected domains:</span> {props.protectedDomains.length ? props.protectedDomains.join(", ") : "None"}</div>
        <div><span className="text-slate-400">Isolated domains:</span> {props.isolatedDomains.length ? props.isolatedDomains.join(", ") : "None"}</div>
      </div>
    </div>
  );
}
