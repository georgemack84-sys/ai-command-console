export function ContainmentPressureCard(props: {
  containmentPressure: number;
  escalationPressure: number;
  blockedAutonomy: string[];
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-amber-200">Containment Pressure</p>
      <div className="mt-3 space-y-2 text-sm text-slate-300">
        <div className="flex items-center justify-between"><span>Containment pressure</span><span>{Math.round(props.containmentPressure * 100)}%</span></div>
        <div className="flex items-center justify-between"><span>Escalation pressure</span><span>{Math.round(props.escalationPressure * 100)}%</span></div>
        <div className="flex items-center justify-between"><span>Blocked autonomy actions</span><span>{props.blockedAutonomy.length}</span></div>
      </div>
    </div>
  );
}
