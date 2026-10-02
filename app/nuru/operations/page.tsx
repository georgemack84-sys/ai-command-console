import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, Bot, Clock3, Coins, Gauge, RotateCcw } from "lucide-react";
import { getSessionUser } from "@/src/lib/auth";
import { getNuruOperations } from "@/src/server/services/nuru-observability-service";
import "../nuru.css";

export default async function NuruOperationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth?next=/nuru/operations");
  if (user.role !== "admin") redirect("/nuru");
  const operations = await getNuruOperations(); const { totals } = operations;
  const metrics = [{ label: "Agent runs", value: totals.runs, icon: Bot }, { label: "Success rate", value: `${totals.successRate}%`, icon: Gauge }, { label: "Average latency", value: `${totals.averageLatencyMs} ms`, icon: Clock3 }, { label: "Token usage", value: totals.tokenUsage, icon: Coins }, { label: "Retries", value: totals.retries, icon: RotateCcw }, { label: "Human decisions", value: totals.humanOverrides, icon: Activity }];
  return <main className="nuru-shell operations-shell"><header className="nuru-nav"><Link className="nuru-brand" href="/nuru"><span>NURU</span><small>Discover a deeper world</small></Link><nav aria-label="Primary navigation"><Link href="/nuru/agents">Agents</Link><Link href="/nuru/review">Review</Link><Link className="active" href="/nuru/operations">Operations</Link></nav></header><section className="operations-hero"><p className="eyebrow"><Activity size={16} /> Operational observability</p><h1>Agent Operations</h1><p>Measure whether each Nuru specialist earns its place before expanding the system.</p></section><section className="operations-content"><div className="operations-metrics">{metrics.map(({ label, value, icon: Icon }) => <article key={label}><Icon size={19} /><small>{label}</small><strong>{value}</strong></article>)}</div><div className="operations-grid"><section><p className="eyebrow">Agent performance</p><h2>Specialist runs</h2>{operations.byAgent.length ? operations.byAgent.map((agent) => <div className="operations-row" key={agent.agentType}><b>{agent.agentType}</b><span>{agent.runs} runs</span><span>{agent.successRate}% success</span><span>{agent.averageLatencyMs} ms avg.</span></div>) : <p className="queue-empty">No agent runs have been recorded.</p>}</section><section><p className="eyebrow">Tool usage</p><h2>Approved capabilities</h2>{operations.toolUsage.length ? operations.toolUsage.map((tool) => <div className="operations-row" key={tool.tool}><b>{tool.tool}</b><span>{tool.uses} uses</span></div>) : <p className="queue-empty">No tools have been used.</p>}<div className="operations-outcomes"><span>Accepted: {totals.proposalAcceptance}</span><span>Rejected: {totals.proposalRejection}</span><span>Cost: ${totals.modelCost.toFixed(2)}</span></div></section></div></section></main>;
}
