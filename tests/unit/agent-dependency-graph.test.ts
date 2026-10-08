import { describe, expect, it } from "vitest";

import { buildAgentDependencyGraph } from "@/src/server/services/agent-dependency-graph";

describe("buildAgentDependencyGraph", () => {
  it("maps manager delegation and review follow-ups without treating user work as an agent edge", () => {
    const graph = buildAgentDependencyGraph({
      agentNames: ["manager", "planner", "researcher", "builder"],
      tasks: [
        { id: "task_plan", sourceAgent: "manager", agentName: "planner", status: "queued" },
        { id: "task_research", sourceAgent: "user", agentName: "researcher", status: "claimed" },
        { id: "task_build", sourceAgent: "manager", agentName: "builder", status: "completed" },
      ],
      reviews: [{ agentName: "researcher", followupTaskId: "task_build" }],
    });

    expect(graph.nodes.find((node) => node.agentName === "manager")?.downstreamAgents).toEqual(["builder", "planner"]);
    expect(graph.nodes.find((node) => node.agentName === "researcher")?.downstreamAgents).toEqual(["builder"]);
    expect(graph.edges).toEqual([
      expect.objectContaining({ from: "manager", to: "builder", kind: "delegation", completedTasks: 1 }),
      expect.objectContaining({ from: "manager", to: "planner", kind: "delegation", queuedTasks: 1 }),
      expect.objectContaining({ from: "researcher", to: "builder", kind: "review_followup", completedTasks: 1 }),
    ]);
  });

  it("omits self-references and unknown agent sources", () => {
    const graph = buildAgentDependencyGraph({
      agentNames: ["manager", "researcher"],
      tasks: [
        { id: "self", sourceAgent: "researcher", agentName: "researcher", status: "queued" },
        { id: "external", sourceAgent: "system", agentName: "researcher", status: "queued" },
      ],
      reviews: [],
    });

    expect(graph.edges).toEqual([]);
  });
});
