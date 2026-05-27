export function SurvivabilityConfidenceCard(props: {
  survivabilityConfidence: number;
  systemicRisk: number;
  civilizationScaleRisk: number;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-emerald-200">Survivability Confidence</p>
      <div className="mt-3 space-y-2 text-sm text-slate-300">
        <div className="flex items-center justify-between"><span>Survivability confidence</span><span>{Math.round(props.survivabilityConfidence * 100)}%</span></div>
        <div className="flex items-center justify-between"><span>Systemic risk</span><span>{Math.round(props.systemicRisk * 100)}%</span></div>
        <div className="flex items-center justify-between"><span>Civilization-scale risk</span><span>{Math.round(props.civilizationScaleRisk * 100)}%</span></div>
      </div>
    </div>
  );
}
