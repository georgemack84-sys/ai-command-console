"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Network, ShieldCheck } from "lucide-react";
import "../../nuru.css";

type Source = { sourceType?: string; origin?: string; authority?: string; uri?: string };
type Item = { knowledgeItemId: string; title: string; content: string; contentType: string; project: string | null; confidence: number; source: Source };
type Relationship = { relationshipType: string; confidence: number; direction: string; target: { knowledgeItemId: string; title: string }; decision?: { actor: string; reason: string | null; decidedAt: string } };
type DiscoverDetail = { item: Omit<Item, "content">; content: string; source: Source; provenance: { verified: true }; relationships: Relationship[] };
type Recommendation = { item: { knowledgeItemId: string }; lane: string; score: number; explanation: { summary: string; reasonCodes: string[]; supportingTopics: string[]; sourceStatus: string; confidence: number; rankingVersion: string } };
type ApiResponse<T> = { ok: boolean; data?: T; error?: { message?: string } };

async function load<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const body = await response.json() as ApiResponse<T>;
  if (!response.ok || !body.ok || body.data === undefined) throw new Error(body.error?.message ?? "Unable to load this discovery.");
  return body.data;
}

export default function NuruDiscoveryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void Promise.all([
      load<DiscoverDetail>("/api/nuru/discover/items/" + id),
      load<{ recommendations: Recommendation[] }>("/api/nuru/discover/session"),
    ]).then(([record, session]) => {
      setItem({ ...record.item, content: record.content, source: record.source });
      setRelationships(record.relationships);
      setRecommendation(session.recommendations.find((entry) => entry.item.knowledgeItemId === record.item.knowledgeItemId) ?? null);
    }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Unable to load this discovery."));
  }, [id]);

  if (error) return <main className="nuru-shell discovery-detail-shell"><section className="detail-error"><ShieldCheck size={28} /><h1>This discovery is unavailable</h1><p>{error}</p><Link className="gold-button" href="/nuru/discover">Return to Discover</Link></section></main>;
  if (!item) return <main className="nuru-shell discovery-detail-shell"><section className="detail-error"><p>Loading discovery evidence…</p></section></main>;

  return <main className="nuru-shell discovery-detail-shell">
    <header className="nuru-nav"><Link className="nuru-brand" href="/nuru/discover"><span>NURU</span><small>Discover a deeper world</small></Link><nav aria-label="Primary navigation"><Link href="/nuru/discover">Discover</Link><Link href="/nuru/discover/taste-map">Taste Map</Link><Link href="/nuru/discover/saved">Saved</Link></nav></header>
    <section className="detail-hero"><div className="detail-art catalog-art" aria-hidden="true" /><div className="detail-title"><Link className="back-link" href="/nuru/discover"><ArrowLeft size={16} /> Back to Discover</Link><p className="eyebrow">{item.contentType}</p><h1>{item.title}</h1><p className="detail-meta">{item.project ?? "Nuru"}<span>·</span>{Math.round(item.confidence * 100)}% documented confidence</p><p>Human-admitted knowledge with visible provenance and a bounded recommendation rationale.</p></div></section>
    <section className="detail-grid"><article className="detail-story"><p className="eyebrow">The record</p><p className="lede">{item.content}</p><Link className="gold-button" href="/nuru/discover">Return to Discover <ArrowRight size={16} /></Link>{relationships.length > 0 && <section className="detail-relationships"><p className="eyebrow"><Network size={15} /> Approved relationships</p>{relationships.map((edge) => <div className="detail-relationship" key={edge.target.knowledgeItemId}><Link href={"/nuru/discover/" + edge.target.knowledgeItemId}>{edge.relationshipType.replaceAll("_", " ")} → {edge.target.title} · {Math.round(edge.confidence * 100)}%</Link>{edge.decision && <small>Approved by {edge.decision.actor} · {new Date(edge.decision.decidedAt).toLocaleString()}<br />{edge.decision.reason ?? "No rationale recorded."}</small>}</div>)}</section>}</article>
      <aside className="detail-reasons"><div><p className="eyebrow">Why Nuru chose this</p><p>{recommendation?.explanation.summary ?? "This item is visible because a human governor explicitly admitted it to Discover."}</p></div><div><p className="eyebrow">Recommendation evidence</p><p>{recommendation ? recommendation.lane.replaceAll("_", " ") + " · " + recommendation.score + "% match" : "Human-admitted catalog"}</p>{recommendation && <ul>{recommendation.explanation.reasonCodes.map((code) => <li key={code}>{code.replaceAll("_", " ")}</li>)}</ul>}</div><div><p className="eyebrow">Source and provenance</p><p><b>{item.source.authority ?? "Authority not recorded"}</b><br />{item.source.origin ?? "Source origin not recorded"}</p><p>Provenance verified before catalog admission.</p></div></aside>
    </section>
  </main>;
}
