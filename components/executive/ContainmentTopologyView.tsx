import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function ContainmentTopologyView({
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
        <CardTitle>Containment Topology</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p>Isolated: {isolatedDomains.length ? isolatedDomains.join(", ") : "none"}</p>
        <p>Quarantined: {quarantinedDomains.length ? quarantinedDomains.join(", ") : "none"}</p>
        <p>Degraded: {degradedDomains.length ? degradedDomains.join(", ") : "none"}</p>
      </CardContent>
    </Card>
  );
}
