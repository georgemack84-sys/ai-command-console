function normalizeStep(step = {}, index = 0) {
  return {
    ...step,
    id: String(step.id || `step_${index + 1}`),
    dependsOn: Array.isArray(step.dependsOn)
      ? [...new Set(step.dependsOn.map((value) => String(value)).filter(Boolean))]
      : step.requiresPrerequisite
        ? [String(step.requiresPrerequisite)]
        : [],
  };
}

function buildGraph(steps = []) {
  const normalizedSteps = steps.map(normalizeStep);
  const nodes = new Map(normalizedSteps.map((step) => [step.id, step]));
  const edges = new Map(normalizedSteps.map((step) => [step.id, [...step.dependsOn]]));
  return { normalizedSteps, nodes, edges };
}

function detectDependencyCycle(steps = []) {
  const { normalizedSteps, edges } = buildGraph(steps);
  const visiting = new Set();
  const visited = new Set();
  let cycle = null;

  function visit(stepId, trail = []) {
    if (cycle) {
      return;
    }
    if (visiting.has(stepId)) {
      cycle = [...trail, stepId];
      return;
    }
    if (visited.has(stepId)) {
      return;
    }

    visiting.add(stepId);
    const dependencies = edges.get(stepId) || [];
    for (const dependencyId of dependencies) {
      if (!edges.has(dependencyId)) {
        continue;
      }
      visit(dependencyId, [...trail, stepId]);
    }
    visiting.delete(stepId);
    visited.add(stepId);
  }

  normalizedSteps.forEach((step) => visit(step.id));
  return cycle;
}

function resolveDependencies(steps = [], completedStepIds = [], failedStepIds = []) {
  const completed = new Set((completedStepIds || []).map((value) => String(value)));
  const failed = new Set((failedStepIds || []).map((value) => String(value)));
  const cycle = detectDependencyCycle(steps);

  if (cycle) {
    return {
      cycle,
      readySteps: [],
      deferredSteps: steps.map((step, index) => normalizeStep(step, index)),
    };
  }

  const readySteps = [];
  const deferredSteps = [];
  for (const step of steps.map(normalizeStep)) {
    if (step.dependsOn.some((dependencyId) => failed.has(dependencyId))) {
      deferredSteps.push({ ...step, deferralReason: "dependency" });
      continue;
    }
    if (step.dependsOn.every((dependencyId) => completed.has(dependencyId))) {
      readySteps.push(step);
      continue;
    }
    deferredSteps.push({ ...step, deferralReason: "dependency" });
  }

  return {
    cycle: null,
    readySteps,
    deferredSteps,
  };
}

module.exports = {
  buildGraph,
  detectDependencyCycle,
  resolveDependencies,
};
