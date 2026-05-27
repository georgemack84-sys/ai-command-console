import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function ContinuityModeCard(props: {
  continuityMode: string;
  continuityPreserved: boolean;
  isolatedDomains: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Continuity Mode</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p className="text-white">{props.continuityMode}</p>
        <p>Continuity preserved: {props.continuityPreserved ? "yes" : "no"}</p>
        <p>Isolated domains: {props.isolatedDomains.length ? props.isolatedDomains.join(", ") : "none"}</p>
      </CardContent>
    </Card>
  );
}
