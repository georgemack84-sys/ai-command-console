const fs = require("fs");
const path = require("path");
const {
  loadAgentState,
  saveAgentState,
  appendAgentHistory
} = require("./agentMemory");
const {
  addTask,
  claimNextTask,
  completeTask
} = require("./taskQueue");
const { sendTaskCompletionCallback } = require("./callbacks");

const AGENTS_DIR = path.join(process.cwd(), "agents");
const AGENT_LOG_DIR = path.join(process.cwd(), "logs", "agents");

function ensureLogDir() {
  fs.mkdirSync(AGENT_LOG_DIR, { recursive: true });
}

function logAgentEvent(agentName, payload) {
  ensureLogDir();
  const logPath = path.join(AGENT_LOG_DIR, `${agentName}.log`);
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...payload
  });
  fs.appendFileSync(logPath, line + "\n", "utf8");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getAgentProfile(agentName) {
  const profilePath = path.join(AGENTS_DIR, `${agentName}.json`);

  if (!fs.existsSync(profilePath)) {
    throw new Error(`Agent profile not found: ${profilePath}`);
  }

  const raw = fs.readFileSync(profilePath, "utf8");
  return JSON.parse(raw);
}

function listAgentProfiles() {
  if (!fs.existsSync(AGENTS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(AGENTS_DIR)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(AGENTS_DIR, file), "utf8");
      try {
        return JSON.parse(raw);
      } catch (error) {
        return {
          name: file.replace(/\.json$/i, ""),
          error: `Invalid agent profile: ${error.message}`
        };
      }
    });
}

function buildPlan(goal) {
  const cleanGoal = String(goal || "").trim();

  if (!cleanGoal) {
    return [
      "Clarify the objective",
      "Inspect current project context",
      "Propose the next safe action"
    ];
  }

  return [
    `Analyze goal: ${cleanGoal}`,
    "Inspect relevant local context",
    "Choose the next safe executable action",
    "Record result",
    "Decide whether to continue or stop"
  ];
}

function simulateSafeExecution(planStep, profile, taskDescription = "") {
  const results = [];

  if (taskDescription) {
    results.push(`Task context noted: ${taskDescription}`);
  }

  if (/inspect|analyze|review|context/i.test(planStep)) {
    results.push("Read-only inspection completed.");
  } else if (/choose|propose|decide|plan/i.test(planStep)) {
    results.push("Next action proposal generated.");
  } else if (/record/i.test(planStep)) {
    results.push("Run result recorded.");
  } else {
    results.push("Step evaluated safely.");
  }

  if (profile.allowShellExecution) {
    results.push("Shell execution is permitted by profile, but no shell command was auto-run in this phase.");
  } else {
    results.push("Shell execution blocked by profile.");
  }

  return {
    ok: true,
    summary: results.join(" "),
    mode: "safe-simulated"
  };
}

function routeTask(taskText) {
  const text = String(taskText || "").toLowerCase();

  if (/plan|roadmap|outline|break|organize|sequence|steps|scope|question|brief|thesis|angle/.test(text)) {
    return {
      agentName: "planner",
      priority: 1,
      delegationReason: "Brief emphasizes framing, scope control, or sequencing work.",
      tags: ["planning", "research-brief", "manager-routed"]
    };
  }

  if (/build|implement|code|file|cli|service|runtime|dashboard|ui|feature|draft|write|memo|report|summary|synthesis|slides|publish/.test(text)) {
    return {
      agentName: "builder",
      priority: 2,
      delegationReason: "Brief emphasizes synthesis, drafting, or deliverable creation.",
      tags: ["synthesis", "delivery", "manager-routed"]
    };
  }

  return {
    agentName: "researcher",
    priority: 3,
    delegationReason: "Brief defaults to source scouting and context gathering.",
    tags: ["research", "scouting", "manager-routed"]
  };
}

function routeManagerTask(taskText) {
  const routing = routeTask(taskText);
  const task = addTask(routing.agentName, taskText, {
    priority: routing.priority,
    sourceAgent: "manager",
    delegationReason: routing.delegationReason,
    tags: routing.tags,
    notifyAgent: "manager"
  });

  logAgentEvent("manager", {
    event: "manager_routed_task",
    originalTask: taskText,
    delegatedTo: routing.agentName,
    priority: routing.priority,
    delegationReason: routing.delegationReason,
    taskId: task.id
  });

  appendAgentHistory("manager", {
    type: "manager_routed_task",
    originalTask: taskText,
    delegatedTo: routing.agentName,
    priority: routing.priority,
    delegationReason: routing.delegationReason,
    taskId: task.id
  });

  return {
    ok: true,
    routing,
    task
  };
}

async function startAgent(agentName, goalOverride = "") {
  const profile = getAgentProfile(agentName);
  const prior = loadAgentState(agentName);

  const goal = String(goalOverride || profile.defaultGoal || "").trim();
  const plan = buildPlan(goal);

  const state = {
    ...prior,
    name: agentName,
    active: true,
    status: "running",
    goal,
    createdAt: prior.createdAt || new Date().toISOString(),
    lastRunAt: null,
    stepCount: 0,
    maxSteps: Number(profile.maxStepsPerRun || 5),
    history: Array.isArray(prior.history) ? prior.history : [],
    notes: Array.isArray(prior.notes) ? prior.notes : [],
    currentTask: null,
    lastPlan: plan,
    lastResult: {
      ok: true,
      summary: "Agent initialized."
    }
  };

  saveAgentState(agentName, state);
  appendAgentHistory(agentName, {
    type: "agent_started",
    goal
  });
  logAgentEvent(agentName, {
    event: "agent_started",
    goal,
    maxSteps: state.maxSteps
  });

  return {
    ok: true,
    message: `Agent "${agentName}" started.`,
    state
  };
}

function getAgentStatus(agentName) {
  const state = loadAgentState(agentName);
  return {
    ok: true,
    state
  };
}

async function tickAgent(agentName) {
  const profile = getAgentProfile(agentName);
  const state = loadAgentState(agentName);

  if (!state.active) {
    return {
      ok: false,
      message: `Agent "${agentName}" is not active. Start it first with agent:start ${agentName}.`
    };
  }

  if (state.stepCount >= state.maxSteps) {
    state.active = false;
    state.status = "completed";
    state.lastResult = {
      ok: true,
      summary: "Max step limit reached. Agent stopped safely."
    };
    saveAgentState(agentName, state);
    appendAgentHistory(agentName, {
      type: "agent_completed",
      reason: "max_steps_reached"
    });
    logAgentEvent(agentName, {
      event: "agent_completed",
      reason: "max_steps_reached"
    });

    return {
      ok: true,
      message: `Agent "${agentName}" reached its max step limit and stopped safely.`,
      state
    };
  }

  if (!state.currentTask && agentName !== "manager") {
    const claimedTask = claimNextTask(agentName);

    if (claimedTask) {
      state.currentTask = claimedTask;
      state.goal = claimedTask.description || state.goal;
      state.lastPlan = buildPlan(state.goal);

      appendAgentHistory(agentName, {
        type: "task_claimed",
        taskId: claimedTask.id,
        description: claimedTask.description
      });
      logAgentEvent(agentName, {
        event: "task_claimed",
        taskId: claimedTask.id,
        description: claimedTask.description
      });

      saveAgentState(agentName, state);
    }
  }

  const nextIndex = state.stepCount;
  const nextStep = Array.isArray(state.lastPlan) && state.lastPlan[nextIndex]
    ? state.lastPlan[nextIndex]
    : `Fallback step ${nextIndex + 1}`;

  await sleep(Number(profile.cooldownSeconds || 1) * 1000);

  const execution = simulateSafeExecution(
    nextStep,
    profile,
    state.currentTask ? state.currentTask.description : state.goal
  );

  state.stepCount += 1;
  state.lastRunAt = new Date().toISOString();
  state.lastResult = execution;
  state.notes = Array.isArray(state.notes) ? state.notes : [];
  state.notes.push(`[Step ${state.stepCount}] ${nextStep} -> ${execution.summary}`);

  if (state.notes.length > 50) {
    state.notes = state.notes.slice(-50);
  }

  let completedTask = null;
  let callbackResult = null;

  if (state.currentTask && state.stepCount >= state.lastPlan.length) {
    completedTask = completeTask(state.currentTask.id, execution.summary);

    appendAgentHistory(agentName, {
      type: "task_completed",
      taskId: state.currentTask.id,
      description: state.currentTask.description,
      result: execution.summary
    });

    logAgentEvent(agentName, {
      event: "task_completed",
      taskId: state.currentTask.id,
      description: state.currentTask.description,
      result: execution.summary
    });

    callbackResult = sendTaskCompletionCallback(state.currentTask.id);

    state.currentTask = null;
    state.stepCount = 0;
    state.lastPlan = buildPlan(profile.defaultGoal || "Review next assignment");
    state.goal = profile.defaultGoal || "Review next assignment";
  }

  if (state.stepCount >= state.maxSteps) {
    state.active = false;
    state.status = "completed";
  }

  saveAgentState(agentName, state);
  appendAgentHistory(agentName, {
    type: "agent_tick",
    stepNumber: state.stepCount,
    step: nextStep,
    result: execution.summary
  });
  logAgentEvent(agentName, {
    event: "agent_tick",
    stepNumber: state.stepCount,
    step: nextStep,
    result: execution
  });

  return {
    ok: true,
    message: `Agent "${agentName}" executed a bounded step.`,
    step: nextStep,
    result: execution,
    completedTask,
    callbackResult,
    state
  };
}

function stopAgent(agentName) {
  const state = loadAgentState(agentName);

  state.active = false;
  state.status = "stopped";
  state.lastResult = {
    ok: true,
    summary: "Agent stopped by user."
  };

  saveAgentState(agentName, state);
  appendAgentHistory(agentName, {
    type: "agent_stopped"
  });
  logAgentEvent(agentName, {
    event: "agent_stopped"
  });

  return {
    ok: true,
    message: `Agent "${agentName}" stopped.`,
    state
  };
}

module.exports = {
  getAgentProfile,
  listAgentProfiles,
  routeManagerTask,
  startAgent,
  tickAgent,
  getAgentStatus,
  stopAgent
};
