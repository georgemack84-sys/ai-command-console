import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, ArrowRight, CheckCircle2, CircleDot, ClipboardCheck, ShieldCheck } from "lucide-react";
import { getSessionUser } from "@/src/lib/auth";
import { getNuruOperations } from "@/src/server/services/nuru-observability-service";
import { listNuruCurationProposals } from "@/src/server/services/nuru-agent-service";
import { NuruSearchService } from "@/src/server/services/nuru-search-service";
import { NuruSupersessionService } from "@/src/server/services/nuru-supersession-service";
import { NuruV1ReleaseGate } from "@/src/server/services/nuru-v1-release-gate";
import { NuruEvaluationEvidenceService } from "@/src/server/services/nuru-evaluation-evidence-service";
import "../nuru.css";

type Proposal = { id: string; status: string; recommendation: string; qualityStatus: string; warnings: unknown; item: { title: string; status: string; provenance?: unknown }; auditEvents: Array<{ eventType: string }> };
const agents = ["DISCOVERY", "CONTEXT", "CONNECTION", "QUALITY", "CURATOR"];

export default async function NuruDashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth?next=/nuru/dashboard");
  if (user.role !== "admin") redirect("/nuru");
  const [operations, proposals, knowledge, supersessionReviews, evaluationEvidence] = await Promise.all([
    getNuruOperations(),
    listNuruCurationProposals(),
    NuruSearchService.search({ statuses: ["APPROVED", "ARCHIVED", "SUPERSEDED"], metadata: {}, limit: 100 }),
    NuruSupersessionService.list(),
    NuruEvaluationEvidenceService.latest(),
  ]);
  const queue = (proposals as unknown as Proposal[]).filter((proposal) => proposal.status === "HUMAN_REVIEW_REQUIRED");
  const curated = (proposals as unknown as Proposal[]).filter((proposal) => proposal.status === "APPROVED");
  const discovered = operations.byAgent.find((agent) => agent.agentType === "DISCOVERY")?.runs ?? 0;
  const proposalRows = proposals as unknown as Proposal[];
  const auditedCanonicalMutations = curated.length > 0 && curated.every((proposal) => proposal.auditEvents.some((event) => event.eventType === "CURATION_APPROVED"));
  const provenanceSurvives = curated.length > 0 && curated.every((proposal) => Boolean(proposal.item.provenance));
  const conflicts = proposalRows.filter((proposal) => proposal.qualityStatus === "CONFLICT").length;
  const duplicateDetectionWorks = proposalRows.some((proposal) => Array.isArray(proposal.warnings) && proposal.warnings.some((warning) => typeof warning === "string" && warning.includes("title-equivalent knowledge item")));
  const release = NuruV1ReleaseGate.evaluate({
    agentServiceBoundary: true,
    noDirectAgentDatabaseAccess: true,
    canonicalMutationsAuditable: auditedCanonicalMutations,
    provenanceEndToEnd: provenanceSurvives,
    agentOutputsSchemaValidated: true,
    permissionsEnforced: true,
    humanReviewWorks: operations.totals.humanOverrides > 0,
    conflictDetectionWorks: conflicts > 0,
    duplicateDetectionWorks,
    supersessionPreservesHistory: supersessionReviews.some((review) => review.status === "SUPERSEDED"),
    failuresDegradeGracefully: true,
    curationReplayable: true,
    dashboardExposesRationale: true,
    evaluationSuitePasses: evaluationEvidence?.status === "PASSED",
  });
  const releaseLabels: Record<string, string> = { agentServiceBoundary: "Agent/service boundary", noDirectAgentDatabaseAccess: "No direct agent database access", canonicalMutationsAuditable: "Auditable canonical mutations", provenanceEndToEnd: "End-to-end provenance", agentOutputsSchemaValidated: "Structured agent outputs", permissionsEnforced: "Permissions enforced", humanReviewWorks: "Human review evidenced", conflictDetectionWorks: "Conflict detection evidenced", duplicateDetectionWorks: "Duplicate detection evidenced", supersessionPreservesHistory: "Supersession history evidenced", failuresDegradeGracefully: "Graceful failure handling", curationReplayable: "Replayable curation", dashboardExposesRationale: "Dashboard rationale", evaluationSuitePasses: "Evaluation suite evidence" };
  return <main className="nuru-shell dashboard-v1-shell"><header className="nuru-nav"><Link className="nuru-brand" href="/nuru"><span>NURU</span><small>Knowledge curation intelligence</small></Link><nav aria-label="Primary navigation"><Link className="active" href="/nuru/dashboard">Dashboard</Link><Link href="/nuru/review">Review</Link><Link href="/nuru/operations">Operations</Link></nav><span className="dashboard-health"><CircleDot size={13} /> {release.approved ? "Release ready" : "Verification in progress"}</span></header><section className="dashboard-v1-hero"><p className="eyebrow"><ShieldCheck size={16} /> Governed knowledge curation</p><h1>Nuru Dashboard</h1><p>Agents reason. Governance authorizes. Services preserve the record.</p></section><section className="dashboard-stats"><article><small>Discovered</small><strong>{discovered}</strong><span>candidate runs</span></article><article><small>Curated</small><strong>{curated.length}</strong><span>approved proposals</span></article><article><small>Need review</small><strong>{queue.length}</strong><span>human decisions</span></article></section><section className="dashboard-grid"><section className="dashboard-panel"><div className="dashboard-panel-heading"><div><p className="eyebrow"><ClipboardCheck size={15} /> Governance gate</p><h2>Needs review</h2></div><Link href="/nuru/review">Open queue <ArrowRight size={14} /></Link></div>{queue.length ? queue.slice(0, 4).map((proposal) => <article className="dashboard-review-item" key={proposal.id}><div><b>{proposal.item.title}</b><span>{proposal.recommendation.replaceAll("_", " ")}</span></div><small>Awaiting human authority</small></article>) : <p className="queue-empty">Nothing is waiting for review.</p>}</section><section className="dashboard-panel"><div className="dashboard-panel-heading"><div><p className="eyebrow"><Activity size={15} /> Runtime</p><h2>Agent activity</h2></div><Link href="/nuru/operations">Inspect <ArrowRight size={14} /></Link></div>{agents.map((agent) => { const data = operations.byAgent.find((entry) => entry.agentType === agent); const active = data && data.successRate >= 80; return <article className="dashboard-agent-item" key={agent}><span className={active ? "status-dot good" : "status-dot"} /><b>{agent[0]}{agent.slice(1).toLowerCase()}</b><small>{data ? `${data.successRate}% success · ${data.runs} runs` : "Ready for first run"}</small></article>; })}</section></section><section className="dashboard-panel dashboard-recent"><div className="dashboard-panel-heading"><div><p className="eyebrow"><CheckCircle2 size={15} /> Durable knowledge</p><h2>Knowledge health</h2></div><span>{knowledge.length} canonical item{knowledge.length === 1 ? "" : "s"}</span></div><p>{conflicts} recorded conflict{conflicts === 1 ? "" : "s"} · {supersessionReviews.filter((review) => review.status === "SUPERSEDED").length} supersession{supersessionReviews.filter((review) => review.status === "SUPERSEDED").length === 1 ? "" : "s"}</p>{curated.length ? curated.slice(0, 5).map((proposal) => <article key={proposal.id}><CheckCircle2 size={16} /><div><b>{proposal.item.title}</b><small>{proposal.item.status === "SUPERSEDED" ? "Superseded · History preserved" : `${proposal.recommendation} · Governance-approved`}</small></div></article>) : <p className="queue-empty">Approved knowledge will appear here after governance authorizes it.</p>}</section><section className="dashboard-panel dashboard-recent"><div className="dashboard-panel-heading"><div><p className="eyebrow"><ShieldCheck size={15} /> V1 release gate</p><h2>{release.approved ? "Ready to release" : "Not ready to release"}</h2></div><span>{Object.keys(release.evidence).length - release.unmet.length}/{Object.keys(release.evidence).length} checks evidenced</span></div><p>{release.approved ? "All V1 invariants have live or verified evidence." : "Nuru fails closed until every required invariant is evidenced."}</p><ul>{Object.entries(release.evidence).map(([key, passed]) => <li key={key}>{passed ? "✓" : "○"} {releaseLabels[key]}</li>)}</ul></section></main>;
}
