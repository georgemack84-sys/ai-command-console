import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function GovernanceIntegrityCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-300">
        <p className="text-white">{value}</p>
      </CardContent>
    </Card>
  );
}
