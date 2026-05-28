import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function IsolationBoundaryPanel({
  isolatedDomains,
  quarantinedDomains,
  degradedDomains,
}: {
  isolatedDomains: string[];
  quarantinedDomains: string[];
  degradedDomains: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Isolation Boundaries</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p>Isolated domains: {isolatedDomains.length ? isolatedDomains.join(", ") : "none"}</p>
        <p>Quarantined domains: {quarantinedDomains.length ? quarantinedDomains.join(", ") : "none"}</p>
        <p>Degraded domains: {degradedDomains.length ? degradedDomains.join(", ") : "none"}</p>
      </CardContent>
    </Card>
  );
}
