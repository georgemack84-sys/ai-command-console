import type { SkillEdge, SkillGraphRepository, SkillNode } from "../../types/learning-constitution/skillGraph";
import { validateSkillGraph, validateSkillNode } from "./skillGraph";

export type SkillGraphAuthoringPreview = Readonly<{ valid: boolean; errors: readonly string[]; nodes: readonly SkillNode[]; edges: readonly SkillEdge[] }>;

/** Validates an author draft before any repository write; rationale is required by the graph contract. */
export const previewSkillGraphDraft = (nodes: readonly SkillNode[], edges: readonly SkillEdge[]): SkillGraphAuthoringPreview => {
  try {
    nodes.forEach(validateSkillNode);
    validateSkillGraph(nodes, edges);
    return { valid: true, errors: [], nodes, edges };
  } catch (error) {
    return { valid: false, errors: [error instanceof Error ? error.message : "skill graph draft is invalid"], nodes, edges };
  }
};

export class SkillGraphAuthoringService {
  constructor(private readonly repository: SkillGraphRepository) {}
  async publish(nodes: readonly SkillNode[], edges: readonly SkillEdge[]): Promise<SkillGraphAuthoringPreview> {
    const preview = previewSkillGraphDraft(nodes, edges);
    if (!preview.valid) return preview;
    for (const node of nodes) await this.repository.createNode(node);
    for (const edge of edges) await this.repository.createEdge(edge);
    return preview;
  }
}
