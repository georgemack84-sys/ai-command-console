import { describe, expect, it } from "vitest";
import { InMemorySkillGraphRepository, LINUX_SKILL_GRAPH_EDGES, LINUX_SKILL_GRAPH_NODES, previewSkillGraphDraft, SkillGraphAuthoringService } from "@/services/learning-constitution";

describe("skill graph authoring", () => {
  it("accepts a valid draft and publishes it only after whole-graph validation", async () => {
    const repository = new InMemorySkillGraphRepository();
    const service = new SkillGraphAuthoringService(repository);
    await expect(service.publish(LINUX_SKILL_GRAPH_NODES, LINUX_SKILL_GRAPH_EDGES)).resolves.toMatchObject({ valid: true });
    expect(await repository.findAllEdges()).toHaveLength(LINUX_SKILL_GRAPH_EDGES.length);
  });

  it("rejects a cyclic draft with its author-visible validation reason", () => {
    const preview = previewSkillGraphDraft(LINUX_SKILL_GRAPH_NODES, [...LINUX_SKILL_GRAPH_EDGES, { ...LINUX_SKILL_GRAPH_EDGES[0], id: "author-cycle", from_skill_id: "linux", to_skill_id: "linux.systemd" }]);
    expect(preview).toMatchObject({ valid: false, errors: ["skill graph contains a prohibited cycle"] });
  });
});
