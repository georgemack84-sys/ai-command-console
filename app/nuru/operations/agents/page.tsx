"use client";
import { useEffect, useState } from "react";
type Agent = { agentType: string; runs: number; successRate: number; averageLatencyMs: number };
type OperationsResponse = { ok: boolean; data?: { byAgent?: Agent[] }; error?: { message?: string } };

export default function AgentOperationsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selected, setSelected] = useState<Agent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void fetch("/api/nuru/agents/runs")
      .then(async (response) => ({ response, body: (await response.json()) as OperationsResponse }))
      .then(({ response, body }) => {
        if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Unable to load Nuru agent operations.");
        if (!active) return;
        const rows = body.data?.byAgent ?? [];
        setAgents(rows);
        setSelected(rows[0] ?? null);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to load Nuru agent operations.");
      });

    return () => { active = false; };
  }, []);

  return <main className="nuru-shell"><section style={{ maxWidth: 1120, margin: "auto", padding: "55px 0" }}><p className="eyebrow">Nuru / Operations</p><h1 style={{ fontFamily: "'DM Serif Display'", fontSize: 54 }}>Agent Operations</h1>{error ? <p role="alert">Unable to load operations: {error}</p> : <><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>{agents.map((agent) => <button key={agent.agentType} onClick={() => setSelected(agent)} style={{ textAlign: "left", padding: 22, border: "1px solid rgba(225,202,158,.32)", background: selected?.agentType === agent.agentType ? "#242b28" : "#101616", color: "#f3eadb" }}><small style={{ color: "#e8c17f" }}>● ACTIVE</small><h2>{agent.agentType}</h2><p>Runs: {agent.runs}</p><p>Success: {agent.successRate}%</p></button>)}</div>{selected ? <article style={{ marginTop: 20, padding: 25, border: "1px solid rgba(225,202,158,.32)" }}><p className="eyebrow">Live run summary · {selected.agentType}</p><h2>Operational evidence</h2><p>Average duration: {selected.averageLatencyMs} ms</p><p>Run details, tool use, tokens, cost, output, and audit records remain available through the governed run and audit APIs.</p></article> : <p>No agent runs recorded yet.</p>}</>}</section></main>;
}
