import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { RecoveryReadModel } from "@/types/recoveryReadModel";

const flagLabels: Array<{ key: keyof RecoveryReadModel["risk"]; label: string }> = [
  { key: "hasFailure", label: "FAILURE" },
  { key: "hasVerificationFailure", label: "VERIFICATION FAILURE" },
  { key: "hasStaleLock", label: "STALE LOCK" },
  { key: "hasOpenAdvisory", label: "OPEN ADVISORY" },
  { key: "hasUnsafeUnknown", label: "UNSAFE UNKNOWN" },
  { key: "hasLearningWarnings", label: "LEARNING WARNINGS" },
  { key: "requiresOperatorAttention", label: "ATTENTION REQUIRED" },
];

export function RecoveryRiskFlags({ risk }: { risk: RecoveryReadModel["risk"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Flags</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {flagLabels.map((flag) => (
            <Badge
              key={flag.key}
              className={
                risk[flag.key]
                  ? "border-amber-300/20 bg-amber-300/10 text-amber-50"
                  : "border-white/10 bg-white/6 text-slate-400"
              }
            >
              {flag.label}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

