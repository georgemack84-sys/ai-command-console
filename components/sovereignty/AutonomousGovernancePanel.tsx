export function AutonomousGovernancePanel(props: {
  operatorSupremacyPreserved: boolean;
  blockedAutonomy: string[];
  supervisionState: string;
  operatorInterventionRequired: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
      <h3 className="text-lg font-semibold text-white">Autonomous governance</h3>
      <div className="mt-3 space-y-2 text-sm text-slate-300">
        <div className="flex items-center justify-between"><span>Operator supremacy</span><span>{props.operatorSupremacyPreserved ? "Preserved" : "Risk"}</span></div>
        <div className="flex items-center justify-between"><span>Supervision state</span><span>{props.supervisionState}</span></div>
        <div className="flex items-center justify-between"><span>Operator intervention</span><span>{props.operatorInterventionRequired ? "Required" : "Not required"}</span></div>
        <div><span className="text-slate-400">Blocked autonomy:</span> {props.blockedAutonomy.length ? props.blockedAutonomy.join(", ") : "None"}</div>
      </div>
    </div>
  );
}
