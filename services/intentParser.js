function classifyIntent(input) {
  const text = String(input || "").trim();
  const lower = text.toLowerCase();

  if (!text) {
    return {
      category: "empty",
      confidence: 1,
      reason: "No input provided.",
    };
  }

  if (
    lower === "help" ||
    lower.startsWith("help ") ||
    lower === "what can you do"
  ) {
    return {
      category: "help",
      confidence: 0.99,
      reason: "Matches built-in help command pattern.",
    };
  }

  if (
    lower === "history" ||
    lower === "last" ||
    lower === "repeat last"
  ) {
    return {
      category: "history",
      confidence: 0.99,
      reason: "Matches built-in history commands.",
    };
  }

  if (
    lower === "macro list" ||
    lower.startsWith("macro save ") ||
    lower.startsWith("macro run ") ||
    lower.startsWith("macro remove ")
  ) {
    return {
      category: "macro",
      confidence: 0.99,
      reason: "Matches macro command pattern.",
    };
  }

  if (
    lower === "status" ||
    lower === "status queue" ||
    lower === "status memory" ||
    lower === "status plugins" ||
    lower === "status health"
  ) {
    return {
      category: "status",
      confidence: 0.99,
      reason: "Matches system status command pattern.",
    };
  }

  if (
    lower === "queue" ||
    lower === "queue pending" ||
    lower === "queue done" ||
    lower === "queue failed" ||
    lower === "queue summary" ||
    lower === "run next" ||
    lower === "clear queue" ||
    lower.startsWith("queue add ") ||
    lower.startsWith("run task ") ||
    lower.startsWith("remove task ") ||
    lower.startsWith("retry task ") ||
    lower.startsWith("whyfailed ")
  ) {
    return {
      category: "queue",
      confidence: 0.99,
      reason: "Matches task queue command pattern.",
    };
  }

  if (
    lower === "diagnose" ||
    lower === "whyblocked" ||
    lower.startsWith("diagnose ")
  ) {
    return {
      category: "diagnostics",
      confidence: 0.98,
      reason: "Matches diagnostics pattern.",
    };
  }

  if (
    lower === "plugins" ||
    lower.startsWith("run plugin ")
  ) {
    return {
      category: "plugin",
      confidence: 0.98,
      reason: "Matches plugin command pattern.",
    };
  }

  if (
    /^write\s+/i.test(text) ||
    /^append\s+/i.test(text) ||
    /^read\s+/i.test(text) ||
    /^summarize\s+/i.test(text) ||
    lower.includes("list files") ||
    lower.includes("show files") ||
    lower.includes("what files")
  ) {
    return {
      category: "tool",
      confidence: 0.9,
      reason: "Looks like direct tool usage.",
    };
  }

  if (
    lower.includes(" and save ") ||
    lower.includes(" and summarize") ||
    lower.includes("inspect the project") ||
    lower.includes("analyze ") ||
    lower.includes("append the result") ||
    lower.includes("make a summary file")
  ) {
    return {
      category: "goal",
      confidence: 0.86,
      reason: "Looks like a multi-step or outcome-oriented request.",
    };
  }

  return {
    category: "chat",
    confidence: 0.65,
    reason: "Defaulting to conversational or general input.",
  };
}

module.exports = {
  classifyIntent,
};