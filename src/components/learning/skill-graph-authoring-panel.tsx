"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { previewSkillGraphDraft } from "@/services/learning-constitution/skillGraphAuthoringService";
import type { SkillEdge, SkillNode } from "@/types/learning-constitution";

export function SkillGraphAuthoringPanel({ initialNodes, initialEdges }: { initialNodes: readonly SkillNode[]; initialEdges: readonly SkillEdge[] }) {
  const [nodes, setNodes] = useState(JSON.stringify(initialNodes, null, 2));
  const [edges, setEdges] = useState(JSON.stringify(initialEdges, null, 2));
  const [result, setResult] = useState<string | null>(null);
  const validate = () => {
    try {
      const preview = previewSkillGraphDraft(JSON.parse(nodes) as SkillNode[], JSON.parse(edges) as SkillEdge[]);
      setResult(preview.valid ? "Draft is valid. It can be published by the authoring service." : preview.errors.join(" "));
    } catch { setResult("Draft must contain valid JSON arrays for nodes and edges."); }
  };
  return <Card><CardHeader><CardTitle>Author skill graph</CardTitle><CardDescription>Edit nodes and edges, including a rationale on every edge. Validate before publishing; containment and prerequisite cycles are rejected.</CardDescription></CardHeader><CardContent className="space-y-4"><label className="block text-sm font-medium text-white">Nodes<textarea aria-label="Skill nodes JSON" value={nodes} onChange={(event) => setNodes(event.target.value)} className="mt-2 min-h-48 w-full rounded-xl border border-white/10 bg-slate-950 p-3 font-mono text-xs text-slate-200" /></label><label className="block text-sm font-medium text-white">Edges<textarea aria-label="Skill edges JSON" value={edges} onChange={(event) => setEdges(event.target.value)} className="mt-2 min-h-48 w-full rounded-xl border border-white/10 bg-slate-950 p-3 font-mono text-xs text-slate-200" /></label><Button onClick={validate}>Validate graph draft</Button>{result ? <p role="status" className="text-sm text-slate-300">{result}</p> : null}</CardContent></Card>;
}
