import type { NuruDiscoverCatalogItem } from "@/src/server/services/nuru-discover-catalog-service";
import { listNuruDiscoverCatalog } from "@/src/server/services/nuru-discover-catalog-service";
import { nuruKnowledgeRepository, type RelationshipRow } from "@/src/server/repositories/nuru-knowledge-repository";

export type NuruDiscoverPath = {
  id: string;
  steps: Array<Pick<NuruDiscoverCatalogItem, "knowledgeItemId" | "title" | "summary" | "contentType" | "confidence">>;
  relationship: { type: string; confidence: number; evidence: "HUMAN_APPROVED" };
  explanation: string;
};

export type NuruDiscoverPathCandidate = {
  id: string;
  steps: Array<Pick<NuruDiscoverCatalogItem, "knowledgeItemId" | "title" | "summary" | "contentType" | "confidence">>;
  sharedTopics: string[];
  pendingRelationshipType?: string;
  explanation: string;
};

export type NuruDiscoverPathBranch = {
  id: string;
  source: Pick<NuruDiscoverCatalogItem, "knowledgeItemId" | "title" | "summary" | "contentType" | "confidence">;
  options: Array<{
    id: string;
    target: Pick<NuruDiscoverCatalogItem, "knowledgeItemId" | "title" | "summary" | "contentType" | "confidence">;
    relationship: { type: string; confidence: number; evidence: "HUMAN_APPROVED" };
    explanation: string;
  }>;
};

export type NuruDiscoverPathReadiness = { paths: NuruDiscoverPath[]; branches: NuruDiscoverPathBranch[]; candidates: NuruDiscoverPathCandidate[] };

export type NuruDiscoverBranchInspection = {
  id: string;
  source: Pick<NuruDiscoverCatalogItem, "knowledgeItemId" | "title" | "summary" | "contentType" | "confidence">;
  target: Pick<NuruDiscoverCatalogItem, "knowledgeItemId" | "title" | "summary" | "contentType" | "confidence">;
  relationship: { type: string; confidence: number; evidence: string };
  decision: { actor: string; reason: string | null; decidedAt: string } | null;
  continuations: Array<{
    id: string;
    target: Pick<NuruDiscoverCatalogItem, "knowledgeItemId" | "title" | "summary" | "contentType" | "confidence">;
    relationship: { type: string; confidence: number; evidence: string };
  }>;
  reviewCues: Array<{
    target: Pick<NuruDiscoverCatalogItem, "knowledgeItemId" | "title" | "summary" | "contentType" | "confidence">;
    sharedTopics: string[];
  }>;
};

/** Builds paths only from catalog material joined by human-approved graph edges. */
export function buildNuruDiscoverPaths(catalog: NuruDiscoverCatalogItem[], relationships: RelationshipRow[]): NuruDiscoverPath[] {
  const byId = new Map(catalog.map((item) => [item.knowledgeItemId, item]));
  const emitted = new Set<string>();
  return relationships.flatMap((relationship) => {
    if (relationship.status !== "APPROVED") return [];
    const source = byId.get(relationship.sourceItemId);
    const target = byId.get(relationship.targetItemId);
    if (!source || !target) return [];
    const key = [source.knowledgeItemId, target.knowledgeItemId].sort().join(":");
    if (emitted.has(key)) return [];
    emitted.add(key);
    return [{
      id: relationship.sourceItemId + ":" + relationship.targetItemId + ":" + relationship.relationshipType,
      steps: [source, target].map(({ knowledgeItemId, title, summary, contentType, confidence }) => ({ knowledgeItemId, title, summary, contentType, confidence })),
      relationship: { type: relationship.relationshipType, confidence: relationship.confidence, evidence: "HUMAN_APPROVED" },
      explanation: "This path follows a human-approved " + relationship.relationshipType.replaceAll("_", " ").toLowerCase() + " relationship between two explicitly admitted Discover records.",
    }];
  });
}

/** Groups only approved, directed graph edges into explicit next-step choices. */
export function buildNuruDiscoverPathBranches(catalog: NuruDiscoverCatalogItem[], relationships: RelationshipRow[]): NuruDiscoverPathBranch[] {
  const byId = new Map(catalog.map((item) => [item.knowledgeItemId, item]));
  const branches = new Map<string, NuruDiscoverPathBranch>();
  for (const relationship of relationships) {
    if (relationship.status !== "APPROVED") continue;
    const source = byId.get(relationship.sourceItemId);
    const target = byId.get(relationship.targetItemId);
    if (!source || !target) continue;
    const sourceStep = (({ knowledgeItemId, title, summary, contentType, confidence }) => ({ knowledgeItemId, title, summary, contentType, confidence }))(source);
    const targetStep = (({ knowledgeItemId, title, summary, contentType, confidence }) => ({ knowledgeItemId, title, summary, contentType, confidence }))(target);
    const branch = branches.get(source.knowledgeItemId) ?? { id: source.knowledgeItemId, source: sourceStep, options: [] };
    branch.options.push({
      id: relationship.id,
      target: targetStep,
      relationship: { type: relationship.relationshipType, confidence: relationship.confidence, evidence: "HUMAN_APPROVED" },
      explanation: `A human governor approved this ${relationship.relationshipType.replaceAll("_", " ").toLowerCase()} connection.`,
    });
    branches.set(source.knowledgeItemId, branch);
  }
  return [...branches.values()].map((branch) => ({ ...branch, options: branch.options.sort((left, right) => right.relationship.confidence - left.relationship.confidence || left.target.title.localeCompare(right.target.title)) })).sort((left, right) => right.options.length - left.options.length || left.source.title.localeCompare(right.source.title));
}

/** Topic overlap is a review cue, not a graph edge or a Discover path. */
export function buildNuruDiscoverPathCandidates(catalog: NuruDiscoverCatalogItem[], relationships: RelationshipRow[]): NuruDiscoverPathCandidate[] {
  const approved = new Set(relationships.filter((relationship) => relationship.status === "APPROVED").map((relationship) => [relationship.sourceItemId, relationship.targetItemId].sort().join(":")));
  const proposed = new Map(relationships.filter((relationship) => relationship.status === "PROPOSED").map((relationship) => [[relationship.sourceItemId, relationship.targetItemId].sort().join(":"), relationship.relationshipType]));
  const candidates: NuruDiscoverPathCandidate[] = [];
  for (let sourceIndex = 0; sourceIndex < catalog.length; sourceIndex += 1) {
    for (let targetIndex = sourceIndex + 1; targetIndex < catalog.length; targetIndex += 1) {
      const source = catalog[sourceIndex]; const target = catalog[targetIndex];
      const key = [source.knowledgeItemId, target.knowledgeItemId].sort().join(":");
      if (approved.has(key)) continue;
      const sharedTopics = source.topics.filter((topic) => target.topics.includes(topic));
      if (!sharedTopics.length) continue;
      candidates.push({
        id: key,
        steps: [source, target].map(({ knowledgeItemId, title, summary, contentType, confidence }) => ({ knowledgeItemId, title, summary, contentType, confidence })),
        sharedTopics,
        ...(proposed.has(key) ? { pendingRelationshipType: proposed.get(key) } : {}),
        explanation: `Both records are admitted to Discover and share ${sharedTopics.join(", ")}. This is a review cue, not an approved relationship.`,
      });
    }
  }
  return candidates.sort((left, right) => right.sharedTopics.length - left.sharedTopics.length || left.steps[0].title.localeCompare(right.steps[0].title)).slice(0, 3);
}

export async function getNuruDiscoverPathReadiness(limit = 6): Promise<NuruDiscoverPathReadiness> {
  const catalog = await listNuruDiscoverCatalog(100);
  if (catalog.length < 2) return { paths: [], branches: [], candidates: [] };
  const itemIds = catalog.map((item) => item.knowledgeItemId);
  const relationships = await nuruKnowledgeRepository.nuruRelationship.findMany({
    where: { status: { in: ["APPROVED", "PROPOSED"] }, sourceItemId: { in: itemIds }, targetItemId: { in: itemIds } },
    orderBy: { confidence: "desc" }, take: 100,
  });
  return {
    paths: buildNuruDiscoverPaths(catalog, relationships).slice(0, Math.max(1, Math.min(limit, 12))),
    branches: buildNuruDiscoverPathBranches(catalog, relationships),
    candidates: buildNuruDiscoverPathCandidates(catalog, relationships),
  };
}

export async function listNuruDiscoverPaths(limit = 6): Promise<NuruDiscoverPath[]> {
  return (await getNuruDiscoverPathReadiness(limit)).paths;
}

/** Reads the evidence trail for a single approved branch before a person follows it. */
export async function getNuruDiscoverBranchInspection(relationshipId: string): Promise<NuruDiscoverBranchInspection | null> {
  const matches = await nuruKnowledgeRepository.nuruRelationship.findMany({ where: { id: relationshipId, status: "APPROVED" }, take: 1 });
  const relationship = matches[0];
  if (!relationship) return null;
  const catalog = await listNuruDiscoverCatalog(100);
  const byId = new Map(catalog.map((item) => [item.knowledgeItemId, item]));
  const source = byId.get(relationship.sourceItemId);
  const target = byId.get(relationship.targetItemId);
  if (!source || !target) return null;
  const audits = await nuruKnowledgeRepository.nuruAuditEvent.findMany({
    where: { eventType: "RELATIONSHIP_APPROVED", resourceId: relationship.sourceItemId, inputReference: relationship.targetItemId, outputReference: relationship.relationshipType, decision: "APPROVED" },
    orderBy: { createdAt: "desc" }, take: 1,
  });
  const audit = audits[0];
  const nextEdges = await nuruKnowledgeRepository.nuruRelationship.findMany({ where: { sourceItemId: relationship.targetItemId, status: "APPROVED" }, orderBy: { confidence: "desc" }, take: 25 });
  const existingEdges = await nuruKnowledgeRepository.nuruRelationship.findMany({ where: { status: { in: ["APPROVED", "PROPOSED"] } }, take: 200 });
  const toStep = ({ knowledgeItemId, title, summary, contentType, confidence }: NuruDiscoverCatalogItem) => ({ knowledgeItemId, title, summary, contentType, confidence });
  return {
    id: relationship.id,
    source: toStep(source),
    target: toStep(target),
    relationship: { type: relationship.relationshipType, confidence: relationship.confidence, evidence: relationship.evidence },
    decision: audit ? { actor: audit.actor, reason: audit.reason, decidedAt: audit.createdAt.toISOString() } : null,
    continuations: nextEdges.flatMap((edge) => {
      if (edge.targetItemId === relationship.sourceItemId) return [];
      const nextTarget = byId.get(edge.targetItemId);
      if (!nextTarget) return [];
      return [{ id: edge.id, target: toStep(nextTarget), relationship: { type: edge.relationshipType, confidence: edge.confidence, evidence: edge.evidence } }];
    }),
    reviewCues: catalog.flatMap((item) => {
      if (item.knowledgeItemId === target.knowledgeItemId || item.knowledgeItemId === source.knowledgeItemId) return [];
      const alreadyConnected = existingEdges.some((edge) => (edge.sourceItemId === target.knowledgeItemId && edge.targetItemId === item.knowledgeItemId) || (edge.sourceItemId === item.knowledgeItemId && edge.targetItemId === target.knowledgeItemId));
      if (alreadyConnected) return [];
      const sharedTopics = target.topics.filter((topic) => item.topics.includes(topic));
      return sharedTopics.length ? [{ target: toStep(item), sharedTopics }] : [];
    }).sort((left, right) => right.sharedTopics.length - left.sharedTopics.length || left.target.title.localeCompare(right.target.title)).slice(0, 3),
  };
}
