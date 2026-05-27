export function SovereigntyRiskPanel(props: {
  autonomyRisk: number;
  systemicRisk: number;
  civilizationScaleRisk: number;
  inheritedReadinessConstraints: string[];
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
      <h3 className="text-lg font-semibold text-white">Sovereignty risk</h3>
      <div className="mt-3 space-y-2 text-sm text-slate-300">
        <div className="flex items-center justify-between"><span>Autonomy risk</span><span>{Math.round(props.autonomyRisk * 100)}%</span></div>
        <div className="flex items-center justify-between"><span>Systemic risk</span><span>{Math.round(props.systemicRisk * 100)}%</span></div>
        <div className="flex items-center justify-between"><span>Civilization-scale risk</span><span>{Math.round(props.civilizationScaleRisk * 100)}%</span></div>
        <div><span className="text-slate-400">Inherited readiness constraints:</span> {props.inheritedReadinessConstraints.length ? props.inheritedReadinessConstraints.join(", ") : "None"}</div>
      </div>
    </div>
  );
}
