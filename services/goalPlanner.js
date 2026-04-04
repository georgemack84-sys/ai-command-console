function normalizeText(input) {
  return String(input || "").trim();
}

function buildGoalPlan(input, modes = {}) {
  const text = normalizeText(input);
  const lower = text.toLowerCase();

  if (lower === "inspect the project and save a file inventory") {
    return {
      type: "goal",
      goal: text,
      tasks: [
        "List project files",
        "Write the file inventory to inventory.txt",
      ],
      steps: [
        { action: "list_files", payload: "." },
        { action: "write_file", payload: "inventory.txt", contentFrom: "previous" },
      ],
      source: "goal-fallback",
      modes,
    };
  }

  const analyzeAndSummarizeMatch = text.match(/^analyze\s+(.+?)\s+and\s+make\s+a\s+summary\s+file$/i);
  if (analyzeAndSummarizeMatch) {
    const target = analyzeAndSummarizeMatch[1].trim();

    return {
      type: "goal",
      goal: text,
      tasks: [
        `Read ${target}`,
        `Summarize ${target}`,
        "Write summary to summary.txt",
      ],
      steps: [
        { action: "read_file", payload: target },
        { action: "summarize_text", payloadFrom: "previous" },
        { action: "write_file", payload: "summary.txt", contentFrom: "previous" },
      ],
      source: "goal-fallback",
      modes,
    };
  }

  const readSummarizeAppendMatch = text.match(
    /^read\s+(.+?),\s*summarize\s+it,\s*and\s*append\s+the\s+result\s+to\s+(.+)$/i
  );

  if (readSummarizeAppendMatch) {
    const sourceFile = readSummarizeAppendMatch[1].trim();
    const targetFile = readSummarizeAppendMatch[2].trim();

    return {
      type: "goal",
      goal: text,
      tasks: [
        `Read ${sourceFile}`,
        `Summarize ${sourceFile}`,
        `Append summary to ${targetFile}`,
      ],
      steps: [
        { action: "read_file", payload: sourceFile },
        { action: "summarize_text", payloadFrom: "previous" },
        { action: "append_file", payload: targetFile, contentFrom: "previous" },
      ],
      source: "goal-fallback",
      modes,
    };
  }

  return null;
}

module.exports = {
  buildGoalPlan,
};