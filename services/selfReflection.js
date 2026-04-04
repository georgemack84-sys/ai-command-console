function toText(value) {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value);
  }
}

function looksBlocked(text) {
  const lower = text.toLowerCase();
  return lower.includes("[safe mode] blocked");
}

function looksDryRun(text) {
  const lower = text.toLowerCase();
  return lower.includes("[dry run]");
}

function looksError(text) {
  const lower = text.toLowerCase();
  return (
    lower.includes("error") ||
    lower.includes("invalid") ||
    lower.includes("not found") ||
    lower.includes("unknown action") ||
    lower.includes("cannot")
  );
}

function summarizeSteps(steps = []) {
  return steps.map((entry, index) => {
    const resultText = toText(entry.result);
    return {
      index: index + 1,
      action: entry.step?.action || "unknown",
      payload: entry.step?.payload || "",
      resultPreview: resultText.slice(0, 160),
      blocked: looksBlocked(resultText),
      dryRun: looksDryRun(resultText),
      errorLike: looksError(resultText),
    };
  });
}

function reflectOnResult(plan, result, modes = {}) {
  const isObject = result && typeof result === "object";
  const stepSummaries = isObject && Array.isArray(result.steps)
    ? summarizeSteps(result.steps)
    : [];

  const finalText = isObject ? toText(result.finalResult || result.message || result) : toText(result);

  let status = "success";
  let reason = "Execution appears to have completed successfully.";
  let nextAction = "No immediate follow-up needed.";

  if (modes.dryRun || looksDryRun(finalText) || stepSummaries.some((s) => s.dryRun)) {
    status = "simulated";
    reason = "Execution was simulated in dry-run mode, so no real changes were made.";
    nextAction = "Run again without --dry-run to perform the action.";
  } else if (stepSummaries.some((s) => s.blocked) || looksBlocked(finalText)) {
    status = "blocked";
    reason = "Execution was blocked by safety controls.";
    nextAction = "Retry without --safe if the action is intentional and trusted.";
  } else if (stepSummaries.some((s) => s.errorLike) || looksError(finalText)) {
    status = "partial";
    reason = "One or more steps appear to have failed or returned an error-like result.";
    nextAction = "Review the failing step output and correct the file path, command, or tool logic.";
  }

  if (plan?.type === "goal" && status === "success") {
    reason = "Goal plan executed and all steps appear to have completed.";
    nextAction = "Inspect the output files or run a follow-up validation command.";
  }

  if (plan?.type === "multi" && status === "success") {
    reason = "Multi-step plan executed and produced a final result.";
    nextAction = "Review the final result or chain another command.";
  }

  return {
    status,
    reason,
    nextAction,
    reviewedAt: new Date().toISOString(),
    stepSummaries,
    finalPreview: finalText.slice(0, 300),
  };
}

module.exports = {
  reflectOnResult,
};