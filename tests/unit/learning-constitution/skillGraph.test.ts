import { describe, expect, it } from "vitest";
import { adaptFlatSkills, buildSkillGraphReadModel, InMemorySkillGraphRepository, LINUX_SKILL_GRAPH, LINUX_SKILL_GRAPH_EDGES, LINUX_SKILL_GRAPH_NODES, validateSkillGraph } from "@/services/learning-constitution";

describe("skill graph foundation", () => {
  it("provides the deterministic, acyclic Linux seed graph with separate hierarchy and prerequisites", () => {
    expect(LINUX_SKILL_GRAPH.hierarchy.linux).toEqual(["linux.bash", "linux.filesystems", "linux.networking", "linux.permissions", "linux.processes", "linux.systemd"]);
    expect(LINUX_SKILL_GRAPH.prerequisites["linux.systemd.troubleshooting"]).toEqual(["linux.systemd.dependencies", "linux.systemd.journald", "linux.systemd.units"]);
    expect(LINUX_SKILL_GRAPH.nodes).toHaveLength(11);
  });

  it("rejects self edges, duplicate edges, dangling references, and cycles", () => {
    expect(() => validateSkillGraph(LINUX_SKILL_GRAPH_NODES, [...LINUX_SKILL_GRAPH_EDGES, { ...LINUX_SKILL_GRAPH_EDGES[0], id: "duplicate", type: "CONTAINS" }])).toThrow("duplicate");
    expect(() => validateSkillGraph(LINUX_SKILL_GRAPH_NODES, [...LINUX_SKILL_GRAPH_EDGES, { ...LINUX_SKILL_GRAPH_EDGES[0], id: "self", from_skill_id: "linux", to_skill_id: "linux" }])).toThrow();
    expect(() => buildSkillGraphReadModel(LINUX_SKILL_GRAPH_NODES, [...LINUX_SKILL_GRAPH_EDGES, { ...LINUX_SKILL_GRAPH_EDGES[0], id: "cycle", from_skill_id: "linux", to_skill_id: "linux.systemd" }])).toThrow("cycle");
  });

  it("keeps evidence append-only and only allows it for known skills", async () => {
    const repository = new InMemorySkillGraphRepository();
    for (const node of LINUX_SKILL_GRAPH_NODES) await repository.createNode(node);
    await expect(repository.appendEvidence({ id: "e1", learner_id: "learner", skill_id: "linux.systemd.journald", kind: "ASSESSMENT", occurred_at: "2026-08-21T00:00:00.000Z", score: 0.4, outcome: "FAIL", evaluator: "SYSTEM" })).resolves.toMatchObject({ id: "e1" });
    await expect(repository.appendEvidence({ id: "e2", learner_id: "learner", skill_id: "missing", kind: "ASSESSMENT", occurred_at: "2026-08-21T00:00:00.000Z", outcome: "FAIL", evaluator: "SYSTEM" })).rejects.toThrow("existing skill");
  });

  it("adapts flat skills without changing their identities or manufacturing history", () => {
    const [migration] = adaptFlatSkills([{ id: "legacy-1", slug: "linux.basics", name: "Linux basics" }]);
    expect(migration).toMatchObject({ flatSkillId: "legacy-1", skillNode: { id: "legacy-1", evidence: [], mastery: null } });
  });
});
