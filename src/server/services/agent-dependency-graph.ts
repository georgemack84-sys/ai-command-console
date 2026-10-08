export type AgentDependencyTask = {
  id?: string;
  agentName?: string;
  sourceAgent?: string;
  status?: string;
};

export type AgentDependencyReview = {
  agentName?: string;
  followupTaskId?: string | null;
};

type DependencyEdge = {
  from: string;
  to: string;
  kind: "delegation" | "review_followup";
  taskIds: string[];
  queuedTasks: number;
  claimedTasks: number;
  completedTasks: number;
};

function normalizeAgentName(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function countTaskStatus(edge: DependencyEdge, status: unknown) {
  switch (String(status || "").toLowerCase()) {
    case "queued":
      edge.queuedTasks += 1;
      break;
    case "claimed":
      edge.claimedTasks += 1;
      break;
    case "completed":
      edge.completedTasks += 1;
      break;
  }
}

/**
 * Builds an operational dependency topology from existing task delegation and
 * review follow-up records. It is descriptive only: it never changes task
 * ownership or scheduling.
 */
export function buildAgentDependencyGraph(input: {
  agentNames: string[];
  tasks: AgentDependencyTask[];
  reviews: AgentDependencyReview[];
}) {
  const agentNames = [...new Set(input.agentNames.map(normalizeAgentName).filter(Boolean))].sort();
  const knownAgents = new Set(agentNames);
  const tasksById = new Map(input.tasks.map((task) => [String(task.id || ""), task]));
  const edges = new Map<string, DependencyEdge>();

  const addEdge = (from: unknown, to: unknown, kind: DependencyEdge["kind"], task?: AgentDependencyTask) => {
    const normalizedFrom = normalizeAgentName(from);
    const normalizedTo = normalizeAgentName(to);

    if (!knownAgents.has(normalizedFrom) || !knownAgents.has(normalizedTo) || normalizedFrom === normalizedTo) {
      return;
    }

    const key = `${normalizedFrom}:${normalizedTo}:${kind}`;
    const edge = edges.get(key) || {
      from: normalizedFrom,
      to: normalizedTo,
      kind,
      taskIds: [],
      queuedTasks: 0,
      claimedTasks: 0,
      completedTasks: 0,
    };

    if (task) {
      const taskId = String(task.id || "");
      if (taskId && !edge.taskIds.includes(taskId)) {
        edge.taskIds.push(taskId);
        countTaskStatus(edge, task.status);
      }
    }
    edges.set(key, edge);
  };

  input.tasks.forEach((task) => addEdge(task.sourceAgent, task.agentName, "delegation", task));

  input.reviews.forEach((review) => {
    const followup = tasksById.get(String(review.followupTaskId || ""));
    if (followup) {
      addEdge(review.agentName, followup.agentName, "review_followup", followup);
    }
  });

  const orderedEdges = [...edges.values()]
    .map((edge) => ({ ...edge, taskIds: [...edge.taskIds].sort() }))
    .sort((left, right) => `${left.from}:${left.to}:${left.kind}`.localeCompare(`${right.from}:${right.to}:${right.kind}`));

  return {
    nodes: agentNames.map((agentName) => ({
      agentName,
      upstreamAgents: orderedEdges.filter((edge) => edge.to === agentName).map((edge) => edge.from),
      downstreamAgents: orderedEdges.filter((edge) => edge.from === agentName).map((edge) => edge.to),
    })),
    edges: orderedEdges,
  };
}
