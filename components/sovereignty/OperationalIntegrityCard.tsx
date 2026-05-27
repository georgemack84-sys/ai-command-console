export function OperationalIntegrityCard(props: {
  constitutionalIntegrity: number;
  governanceReliability: number;
  operationalStability: number;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-sky-200">Operational Integrity</p>
      <div className="mt-3 grid gap-2 text-sm text-slate-300">
        <div className="flex items-center justify-between"><span>Constitutional integrity</span><span>{Math.round(props.constitutionalIntegrity * 100)}%</span></div>
        <div className="flex items-center justify-between"><span>Governance reliability</span><span>{Math.round(props.governanceReliability * 100)}%</span></div>
        <div className="flex items-center justify-between"><span>Operational stability</span><span>{Math.round(props.operationalStability * 100)}%</span></div>
      </div>
    </div>
  );
}
