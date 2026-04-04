function explainWhyBlocked(memory = {}, history = []) {
  const reflection = memory.lastReflection || null;
  const lastHistoryEntry = history.length ? history[history.length - 1] : null;
  const historyReflection = lastHistoryEntry?.reflection || null;

  const source = reflection || historyReflection;

  if (!source) {
    return {
      status: "unknown",
      message: "No recent blocked action was found in memory or history.",
      nextAction: "Run a blocked command with --safe, then use whyblocked again.",
    };
  }

  if (source.status !== "blocked") {
    return {
      status: source.status || "unknown",
      message: `Last execution was not blocked. Current status: ${source.status || "unknown"}.`,
      nextAction: source.nextAction || "No unblock action needed.",
    };
  }

  return {
    status: "blocked",
    message: source.reason || "Execution was blocked by safety controls.",
    nextAction: source.nextAction || "Retry without --safe if appropriate.",
  };
}

function formatWhyBlocked(result) {
  return [
    "=== Why Blocked ===",
    `Status: ${result.status}`,
    `Reason: ${result.message}`,
    `Next: ${result.nextAction}`,
  ].join("\n");
}

module.exports = {
  explainWhyBlocked,
  formatWhyBlocked,
};