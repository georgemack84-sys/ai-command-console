import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function ProtectedSystemsPanel(props: {
  protectedOperationalDomains: string[];
  frozenSystems: string[];
  isolatedSystems: string[];
  continuityPreservedSystems: string[];
  governanceProtectedSystems: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Protected Systems</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p>Protected domains: {props.protectedOperationalDomains.length ? props.protectedOperationalDomains.join(", ") : "none"}</p>
        <p>Frozen systems: {props.frozenSystems.length ? props.frozenSystems.join(", ") : "none"}</p>
        <p>Isolated systems: {props.isolatedSystems.length ? props.isolatedSystems.join(", ") : "none"}</p>
        <p>Continuity-preserved: {props.continuityPreservedSystems.length ? props.continuityPreservedSystems.join(", ") : "none"}</p>
        <p>Governance-protected: {props.governanceProtectedSystems.length ? props.governanceProtectedSystems.join(", ") : "none"}</p>
      </CardContent>
    </Card>
  );
}
