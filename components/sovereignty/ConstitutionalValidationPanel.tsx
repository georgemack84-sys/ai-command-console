export function ConstitutionalValidationPanel(props: {
  validationState: string;
  severity: string;
  failures: string[];
  warnings: string[];
  immutableAuditVerified: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
      <h3 className="text-lg font-semibold text-white">Constitutional validation</h3>
      <div className="mt-3 space-y-2 text-sm text-slate-300">
        <div className="flex items-center justify-between"><span>Validation state</span><span>{props.validationState}</span></div>
        <div className="flex items-center justify-between"><span>Severity</span><span>{props.severity}</span></div>
        <div className="flex items-center justify-between"><span>Immutable audit verified</span><span>{props.immutableAuditVerified ? "Yes" : "No"}</span></div>
        <div><span className="text-slate-400">Failures:</span> {props.failures.length ? props.failures.join(", ") : "None"}</div>
        <div><span className="text-slate-400">Warnings:</span> {props.warnings.length ? props.warnings.join(", ") : "None"}</div>
      </div>
    </div>
  );
}
