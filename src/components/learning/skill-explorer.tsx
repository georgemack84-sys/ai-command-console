import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { SkillGraphReadModel, SkillRecommendation } from "@/types/learning-constitution";
import type React from "react";

const stateLabel = "Not evaluated";

export function SkillExplorer({ graph, recommendation }: { graph: SkillGraphReadModel; recommendation?: SkillRecommendation }) {
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const renderBranch = (id: string): React.ReactNode => {
    const node = byId.get(id); if (!node) return null;
    return <li key={id} className="mt-3"><p className="font-medium text-white">{node.name}</p><p className="mt-1 text-sm text-slate-300">{node.description}</p><p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{stateLabel}</p>{graph.hierarchy[id]?.length ? <ul className="ml-4 border-l border-white/10 pl-4">{graph.hierarchy[id].map(renderBranch)}</ul> : null}</li>;
  };
  const target = recommendation?.target_skill_id ? byId.get(recommendation.target_skill_id) : undefined;
  const blocked = recommendation ? byId.get(recommendation.blocked_skill_id) : undefined;
  return <div className="space-y-6">
    <section className={recommendation ? "grid gap-4 xl:grid-cols-[1.1fr_0.9fr]" : "grid gap-4"}>
      <Card><CardHeader><CardTitle>Skill explorer</CardTitle><CardDescription>Navigate the hierarchy in text. Prerequisites are listed separately so a topic tree never implies readiness.</CardDescription></CardHeader><CardContent><ul aria-label="Linux skill hierarchy" className="text-sm">{renderBranch("linux")}</ul></CardContent></Card>
      {recommendation && <Card><CardHeader><CardTitle>Why this recommendation?</CardTitle><CardDescription>{recommendation.reason}</CardDescription></CardHeader><CardContent className="space-y-4 text-sm text-slate-300"><div><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Next action</p><p className="mt-1 font-medium text-white">{recommendation.next_action === "DIAGNOSTIC_EVALUATION" ? "Take a targeted diagnostic" : `Practice ${target?.name ?? "the recommended skill"}`}</p></div><div><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Path</p><p className="mt-1 text-white">{recommendation.graph_path.map((id) => byId.get(id)?.name ?? id).join(" → ")}</p></div><div><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Evidence</p><p className="mt-1">{recommendation.evidence_ids.length ? recommendation.evidence_ids.join(", ") : "No evidence available"}</p></div><div className="rounded-2xl border border-sky-300/20 bg-sky-300/10 p-4"><p className="font-medium text-sky-100">Focused next action</p><p className="mt-1 text-sky-100/80">{recommendation.status === "RECOMMENDATION" ? `Practice ${target?.name}, then reassess ${blocked?.name ?? "the blocked skill"}.` : "Run a targeted diagnostic before making a study recommendation."}</p></div></CardContent></Card>}
    </section>
    <Card><CardHeader><CardTitle>Prerequisite links</CardTitle><CardDescription>These dependencies are explainable text, not a graph-only visual.</CardDescription></CardHeader><CardContent><dl className="grid gap-3 md:grid-cols-2">{graph.nodes.filter((node) => graph.prerequisites[node.id]?.length).map((node) => <div key={node.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><dt className="font-medium text-white">{node.name}</dt><dd className="mt-2 text-sm text-slate-300">Requires: {graph.prerequisites[node.id].map((id) => byId.get(id)?.name ?? id).join(", ")}</dd></div>)}</dl></CardContent></Card>
  </div>;
}
