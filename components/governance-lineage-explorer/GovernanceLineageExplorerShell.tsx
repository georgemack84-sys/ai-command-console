"use client";

import { CheckCircle2, Fingerprint, GitBranch, GitFork, History, Link2, Lock, Network, ShieldCheck } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { SectionShell } from "@/src/components/ui/section-shell";
import { cn } from "@/src/lib/utils";
import type { GovernanceLineageExplorerView, GovernanceLineagePath } from "@/types/governance-lineage-explorer";

function stateClass(state: string) {
  if (["COMPLETE", "VERIFIED", "true"].includes(state)) return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
  if (["PARTIAL", "RESTRICTED"].includes(state)) return "border-amber-300/20 bg-amber-400/10 text-amber-100";
  if (["BROKEN", "false"].includes(state)) return "border-rose-300/25 bg-rose-400/10 text-rose-100";
  return "border-white/10 bg-white/6 text-slate-100";
}

function metric(label: string, value: string | number, state: string) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
      <Badge className={cn("mt-3", stateClass(state))}>{state}</Badge>
    </div>
  );
}

function pathList(title: string, paths: readonly GovernanceLineagePath[]) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {paths.length === 0 ? <p className="text-sm text-slate-400">No lineage path in this direction.</p> : paths.map((path) => (
          <div key={path.path_id} className="rounded-md border border-white/10 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-white">{path.path_type}</p>
              <Badge className={stateClass(String(path.complete))}>{String(path.complete)}</Badge>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">{path.explanation}</p>
            <p className="mt-2 truncate text-xs text-slate-500">{path.nodes.join(" -> ")}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function GovernanceLineageExplorerShell({ view }: { view: GovernanceLineageExplorerView }) {
  const selected = view.nodes.find((node) => node.node_id === view.selected_node_id);
  return (
    <div className="space-y-6">
      <SectionShell className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200">Governance Lineage</p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-white">Governance Lineage Explorer</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className={stateClass(view.explorer_state)}>{view.explorer_state}</Badge>
              <Badge className={stateClass(String(view.lineage_verified))}>Lineage {String(view.lineage_verified)}</Badge>
              <Badge className="border-white/10 bg-white/5 text-slate-200"><Lock className="mr-1 h-3.5 w-3.5" />Read-only</Badge>
            </div>
          </div>
          <div className="grid min-w-72 gap-2 text-sm text-slate-300">
            <p>Tenant <span className="float-right text-white">{view.tenant_id}</span></p>
            <p>Mission <span className="float-right text-white">{view.mission_id}</span></p>
            <p>Selected <span className="float-right max-w-44 truncate text-white">{selected?.label ?? view.selected_node_id}</span></p>
          </div>
        </div>
      </SectionShell>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metric("Nodes", view.nodes.length, view.explorer_state)}
        {metric("Edges", view.edges.length, view.explorer_state)}
        {metric("Influence Paths", view.influence_paths.length, view.replay_consistent ? "VERIFIED" : "PARTIAL")}
        {metric("Dependencies", view.dependency_chains.length, view.missing_dependencies.length === 0 ? "VERIFIED" : "PARTIAL")}
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <Network className="h-5 w-5 text-cyan-200" />
            <CardTitle>Selected Artifact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selected ? (
              <div className="rounded-md border border-white/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-lg font-semibold text-white">{selected.label}</p>
                  <Badge className={stateClass(selected.integrity_state)}>{selected.integrity_state}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-400">{selected.object_ref}</p>
                <p className="mt-3 text-sm text-slate-300">Depth {selected.lineage_depth} across {selected.node_type.toLowerCase()} lineage.</p>
              </div>
            ) : <p className="text-sm text-slate-400">No selected artifact available.</p>}
            {metric("Replay Consistent", String(view.replay_consistent), String(view.replay_consistent))}
            {metric("Tenant Isolation", String(view.tenant_isolated), String(view.tenant_isolated))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <GitFork className="h-5 w-5 text-emerald-200" />
            <CardTitle>Causal Graph</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {view.edges.map((edge) => (
              <div key={edge.edge_id} className="rounded-md border border-white/10 bg-white/5 p-3">
                <Badge className="border-white/10 bg-white/5 text-slate-200">{edge.relationship_type}</Badge>
                <p className="mt-2 truncate text-xs text-slate-400">{edge.source_node_id}</p>
                <p className="text-xs text-slate-500">to</p>
                <p className="truncate text-xs text-slate-400">{edge.target_node_id}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {pathList("Backward Lineage", view.parent_chain)}
        {pathList("Forward Lineage", view.child_chain)}
        {pathList("Root Lineage", view.root_lineage)}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {pathList("Dependency Explorer", view.dependency_chains)}
        {pathList("Influence Graph", view.influence_paths)}
        {pathList("Supersession History", view.supersession_history)}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <History className="h-5 w-5 text-cyan-200" />
            <CardTitle>Lineage Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {view.timeline.map((event) => (
              <div key={event.event_id} className="grid gap-3 rounded-md border border-white/10 p-3 md:grid-cols-[10rem_1fr_auto]">
                <span className="text-xs text-slate-500">{event.timestamp.slice(11, 19)}</span>
                <span className="text-sm text-white">{event.summary}</span>
                <Badge className="border-white/10 bg-white/5 text-slate-200">{event.event_type.replace(/_/g, " ")}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-200" />
            <CardTitle>Audit References</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border border-white/10 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-white"><Link2 className="h-4 w-4" />Evidence</div>
              {view.evidence_refs.slice(0, 8).map((ref) => <p key={ref} className="mt-2 truncate text-xs text-slate-400">{ref}</p>)}
            </div>
            <div className="rounded-md border border-white/10 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-white"><CheckCircle2 className="h-4 w-4" />Replay</div>
              {view.replay_refs.slice(0, 8).map((ref) => <p key={ref} className="mt-2 truncate text-xs text-slate-400">{ref}</p>)}
            </div>
            <div className="rounded-md border border-white/10 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-white"><Fingerprint className="h-4 w-4" />Hashes</div>
              <p className="mt-2 truncate text-xs text-slate-400">{view.graph_hash}</p>
              <p className="mt-2 truncate text-xs text-slate-400">{view.explorer_hash}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-3">
          <GitBranch className="h-5 w-5 text-cyan-200" />
          <CardTitle>Node Registry</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {view.nodes.map((node) => (
            <div key={node.node_id} className="rounded-md border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-medium text-white">{node.label}</p>
                <Badge className={stateClass(node.integrity_state)}>{node.node_type}</Badge>
              </div>
              <p className="mt-2 truncate text-xs text-slate-500">{node.object_ref}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
