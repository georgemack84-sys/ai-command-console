import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function RecoveryStateCard({
  title,
  value,
  detail,
  tone = "default",
  testId,
}: {
  title: string;
  value: string;
  detail?: string;
  tone?: "default" | "good" | "warning" | "danger";
  testId?: string;
}) {
  const toneClass =
    tone === "good"
      ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-50"
      : tone === "warning"
        ? "border-amber-300/20 bg-amber-300/10 text-amber-50"
        : tone === "danger"
          ? "border-rose-300/20 bg-rose-300/10 text-rose-50"
          : "border-white/10 bg-white/6 text-slate-100";

  return (
    <Card data-testid={testId}>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{title}</CardTitle>
          <Badge className={toneClass}>{value}</Badge>
        </div>
      </CardHeader>
      {detail ? (
        <CardContent>
          <p className="text-sm text-slate-300">{detail}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}

