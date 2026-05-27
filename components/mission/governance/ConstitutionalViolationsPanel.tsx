import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import { Card } from "@/src/components/ui/card";

export function ConstitutionalViolationsPanel({ view }: { view: ConstitutionalGovernanceView }) {
  return (
    <Card id="constitutional-violations">
      <div className="space-y-2 text-sm text-white/70">
        {view.violations.length ? view.violations.map((violation) => (
          <div key={violation.violationId} className="rounded-md border border-white/10 p-3">
            <p className="text-white">{violation.code}</p>
            <p>{violation.message}</p>
          </div>
        )) : <p className="text-white">No constitutional violations currently visible.</p>}
      </div>
    </Card>
  );
}
