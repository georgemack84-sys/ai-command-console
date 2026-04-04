const toolRouter = require("./toolRouter");

async function executeSingleStep(step, modes = {}) {
  if (!step || !step.action) {
    throw new Error("Invalid step");
  }

  if (modes.dryRun) {
    return `[DRY RUN] Would execute action "${step.action}" with payload "${step.payload || ""}"`;
  }

  return toolRouter.route(step, modes);
}

async function executeStepSequence(steps = [], modes = {}) {
  const results = [];
  let previousResult = "";

  for (const step of steps) {
    const resolvedStep = { ...step };

    if (resolvedStep.payloadFrom === "previous") {
      resolvedStep.payload = previousResult;
    }

    if (resolvedStep.contentFrom === "previous") {
      resolvedStep.content = previousResult;
    }

    const stepResult = await executeSingleStep(resolvedStep, modes);

    results.push({
      step: resolvedStep,
      result: stepResult,
    });

    previousResult = stepResult;
  }

  return {
    steps: results,
    finalResult: previousResult,
  };
}

async function execute(plan, modes = {}) {
  if (!plan) {
    throw new Error("Invalid plan");
  }

  if (plan.type === "single") {
    return executeSingleStep(plan, modes);
  }

  if (plan.type === "multi") {
    const sequenceResult = await executeStepSequence(plan.steps || [], modes);

    return {
      message: "Multi-step plan executed successfully.",
      ...sequenceResult,
    };
  }

  if (plan.type === "goal") {
    const sequenceResult = await executeStepSequence(plan.steps || [], modes);

    return {
      message: "Goal plan executed successfully.",
      goal: plan.goal,
      tasks: plan.tasks || [],
      ...sequenceResult,
    };
  }

  throw new Error("Unknown plan type");
}

module.exports = { execute };