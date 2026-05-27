"use client";

import { MetricTile } from "@/src/components/ui/metric-tile";

export function ContinuityRiskCard({
  continuityRiskScore,
  contributors,
}: {
  continuityRiskScore: number;
  contributors: string[];
}) {
  return (
    <div className="space-y-3">
      <MetricTile
        label="Continuity Risk"
        value={String(continuityRiskScore)}
        detail={contributors.length ? contributors.join(", ") : "No major contributors."}
      />
    </div>
  );
}
