import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function DependencyGraphPanel(props: {
  nodes: string[];
  trace: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dependency Graph</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p>Nodes: {props.nodes.join(" -> ")}</p>
        <p>Trace: {props.trace.join(" -> ")}</p>
      </CardContent>
    </Card>
  );
}
