export function CivilizationRiskTimeline(props: {
  collapseRisk: number;
  governanceStressProjection: number;
  projectedContainmentLoad: number;
  uncertaintyLevel: number;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
      <h3 className="text-lg font-semibold text-white">Civilization risk timeline</h3>
      <div className="mt-3 grid gap-2 text-sm text-slate-300">
        <div className="flex items-center justify-between"><span>Collapse risk</span><span>{Math.round(props.collapseRisk * 100)}%</span></div>
        <div className="flex items-center justify-between"><span>Governance stress projection</span><span>{Math.round(props.governanceStressProjection * 100)}%</span></div>
        <div className="flex items-center justify-between"><span>Projected containment load</span><span>{Math.round(props.projectedContainmentLoad * 100)}%</span></div>
        <div className="flex items-center justify-between"><span>Uncertainty level</span><span>{Math.round(props.uncertaintyLevel * 100)}%</span></div>
      </div>
    </div>
  );
}
