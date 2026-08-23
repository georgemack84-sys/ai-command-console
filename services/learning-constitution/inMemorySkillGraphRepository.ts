import type { SkillEdge, SkillEvidence, SkillGraphRepository, SkillNode } from "../../types/learning-constitution/skillGraph";
import { validateSkillEvidence, validateSkillGraph, validateSkillNode } from "./skillGraph";

export class InMemorySkillGraphRepository implements SkillGraphRepository {
  private readonly nodes = new Map<string, SkillNode>(); private readonly edges = new Map<string, SkillEdge>();
  private readonly evidence = new Map<string, SkillEvidence>();
  async createNode(node: SkillNode): Promise<SkillNode> { validateSkillNode(node); const existing = this.nodes.get(node.id); if (existing) return existing; if ([...this.nodes.values()].some((item) => item.slug === node.slug)) throw new Error("skill slug already exists"); this.nodes.set(node.id, node); return node; }
  async createEdge(edge: SkillEdge): Promise<SkillEdge> {
    const existing = this.edges.get(edge.id); if (existing) return existing;
    const candidates = [...this.edges.values(), edge];
    const prerequisites = new Map<string, string[]>();
    for (const candidate of candidates.filter((item) => item.type === "PREREQUISITE")) prerequisites.set(candidate.to_skill_id, [...(prerequisites.get(candidate.to_skill_id) ?? []), candidate.from_skill_id]);
    const normalizedNodes = [...this.nodes.values()].map((node) => ({ ...node, prerequisites: prerequisites.get(node.id) ?? [] }));
    validateSkillGraph(normalizedNodes, candidates);
    for (const node of normalizedNodes) this.nodes.set(node.id, node);
    this.edges.set(edge.id, edge); return edge;
  }
  async appendEvidence(item: SkillEvidence): Promise<SkillEvidence> { validateSkillEvidence(item); const existing = this.evidence.get(item.id); if (existing) return existing; if (!this.nodes.has(item.skill_id)) throw new Error("skill evidence must reference an existing skill"); this.evidence.set(item.id, item); return item; }
  async getNode(id: string): Promise<SkillNode | undefined> { return this.nodes.get(id); }
  async findNodeBySlug(slug: string): Promise<SkillNode | undefined> { return [...this.nodes.values()].find((item) => item.slug === slug); }
  async findAllNodes(): Promise<readonly SkillNode[]> { return [...this.nodes.values()]; }
  async findAllEdges(): Promise<readonly SkillEdge[]> { return [...this.edges.values()]; }
  async findEvidenceBySkillId(skillId: string): Promise<readonly SkillEvidence[]> { return [...this.evidence.values()].filter((item) => item.skill_id === skillId); }
}
