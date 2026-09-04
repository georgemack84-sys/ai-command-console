import type { SkillEdge, SkillEvidence, SkillGraphReadModel, SkillNode } from "../../types/learning-constitution/skillGraph";

const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const unit = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
const timestamp = (value: string): boolean => !Number.isNaN(Date.parse(value));

export const validateSkillNode = (node: SkillNode): SkillNode => {
  if (!nonEmpty(node.id) || !/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(node.slug) || !nonEmpty(node.name) || !nonEmpty(node.description) ||
    !["ACTIVE", "DEPRECATED"].includes(node.status) || !Array.isArray(node.prerequisites) || !node.prerequisites.every(nonEmpty) ||
    new Set(node.prerequisites).size !== node.prerequisites.length || (node.mastery !== null && !unit(node.mastery)) || !unit(node.confidence) ||
    (node.last_evaluated !== null && !timestamp(node.last_evaluated)) || (node.retention_score !== null && !unit(node.retention_score)) ||
    !Array.isArray(node.evidence) || !node.evidence.every(nonEmpty) || new Set(node.evidence).size !== node.evidence.length ||
    !timestamp(node.created_at) || !timestamp(node.updated_at) || !nonEmpty(node.model_version)) throw new Error("skill node is invalid");
  return node;
};

export const validateSkillEvidence = (evidence: SkillEvidence): SkillEvidence => {
  if (!nonEmpty(evidence.id) || !nonEmpty(evidence.learner_id) || !nonEmpty(evidence.skill_id) || !["ASSESSMENT", "PRACTICAL_TASK", "SELF_REPORT", "INSTRUCTOR_REVIEW"].includes(evidence.kind) ||
    !timestamp(evidence.occurred_at) || (evidence.score !== undefined && !unit(evidence.score)) || !["PASS", "PARTIAL", "FAIL", "OBSERVED"].includes(evidence.outcome) ||
    !["SYSTEM", "HUMAN", "LEARNER"].includes(evidence.evaluator)) throw new Error("skill evidence is invalid");
  return evidence;
};

const edgeKey = (edge: SkillEdge): string => `${edge.from_skill_id}:${edge.to_skill_id}:${edge.type}`;
const isAcyclic = (edges: readonly SkillEdge[], type: "CONTAINS" | "PREREQUISITE"): boolean => {
  const adjacency = new Map<string, string[]>();
  for (const edge of edges.filter((item) => item.type === type)) adjacency.set(edge.from_skill_id, [...(adjacency.get(edge.from_skill_id) ?? []), edge.to_skill_id]);
  const visiting = new Set<string>(); const visited = new Set<string>();
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return false; if (visited.has(id)) return true;
    visiting.add(id); for (const target of adjacency.get(id) ?? []) if (!visit(target)) return false;
    visiting.delete(id); visited.add(id); return true;
  };
  return [...adjacency.keys()].every(visit);
};

export const validateSkillGraph = (nodes: readonly SkillNode[], edges: readonly SkillEdge[]): void => {
  const ids = new Set<string>(); const slugs = new Set<string>();
  for (const node of nodes) { validateSkillNode(node); if (ids.has(node.id) || slugs.has(node.slug)) throw new Error("skill nodes must have unique IDs and slugs"); ids.add(node.id); slugs.add(node.slug); }
  const keys = new Set<string>();
  for (const edge of edges) {
    if (!nonEmpty(edge.id) || !ids.has(edge.from_skill_id) || !ids.has(edge.to_skill_id) || edge.from_skill_id === edge.to_skill_id || !["CONTAINS", "PREREQUISITE", "RELATED"].includes(edge.type) || !nonEmpty(edge.rationale) || !timestamp(edge.created_at) ||
      (edge.type === "PREREQUISITE" ? !unit(edge.strength) : edge.strength !== undefined)) throw new Error("skill edge is invalid");
    if (keys.has(edgeKey(edge))) throw new Error("skill graph cannot contain duplicate edges"); keys.add(edgeKey(edge));
  }
  if (!isAcyclic(edges, "CONTAINS") || !isAcyclic(edges, "PREREQUISITE")) throw new Error("skill graph contains a prohibited cycle");
  const prerequisites = new Map(nodes.map((node) => [node.id, new Set<string>()]));
  for (const edge of edges.filter((edge) => edge.type === "PREREQUISITE")) prerequisites.get(edge.to_skill_id)!.add(edge.from_skill_id);
  for (const node of nodes) if (![...prerequisites.get(node.id)!].every((id) => node.prerequisites.includes(id)) || node.prerequisites.length !== prerequisites.get(node.id)!.size) throw new Error("skill node prerequisite read model is inconsistent");
};

export const buildSkillGraphReadModel = (nodes: readonly SkillNode[], edges: readonly SkillEdge[]): SkillGraphReadModel => {
  validateSkillGraph(nodes, edges);
  const ordered = <T extends { id: string }>(items: readonly T[]) => [...items].sort((a, b) => a.id.localeCompare(b.id));
  const index = new Map(nodes.map((node) => [node.id, node]));
  const project = (type: "CONTAINS" | "PREREQUISITE") => Object.fromEntries(ordered(nodes).map((node) => [node.id, ordered(edges.filter((edge) => edge.type === type && edge.to_skill_id === node.id).map((edge) => index.get(edge.from_skill_id)!)).map((node) => node.id)]));
  return { nodes: ordered(nodes), edges: ordered(edges), hierarchy: project("CONTAINS"), prerequisites: project("PREREQUISITE") };
};
