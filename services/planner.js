const OpenAI = require("openai");
const { buildGoalPlan } = require("./goalPlanner");
const { classifyIntent } = require("./intentParser");

function makeSingleStep(action, payload, extra = {}) {
  return {
    type: "single",
    action,
    payload,
    ...extra,
    source: extra.source || "fallback",
  };
}

function makeMultiStep(steps, extra = {}) {
  return {
    type: "multi",
    steps,
    ...extra,
    source: extra.source || "fallback",
  };
}

function attachPlannerMetadata(plan, input, modes = {}) {
  if (!plan || typeof plan !== "object") {
    return plan;
  }

  return {
    ...plan,
    originalRequest: String(plan.originalRequest || input || "").trim(),
    plannerVersion: 2,
    modes: plan.modes || modes,
  };
}

function parseWriteCommand(input) {
  const match = input.match(/^write\s+(.+?)\s*:\s*([\s\S]+)$/i);
  if (!match) return null;

  return makeSingleStep("write_file", match[1].trim(), {
    content: match[2],
  });
}

function parseAppendCommand(input) {
  const match = input.match(/^append\s+(.+?)\s*:\s*([\s\S]+)$/i);
  if (!match) return null;

  return makeSingleStep("append_file", match[1].trim(), {
    content: match[2],
  });
}

function parseRunPluginCommand(input, modes = {}) {
  const match = String(input || "").trim().match(/^run\s+plugin\s+(\S+)(?:\s+([\s\S]+))?$/i);
  if (!match) return null;

  const pluginName = match[1].trim();
  const pluginArg = match[2] ? match[2].trim() : "";

  return makeSingleStep("run_plugin", pluginName, {
    pluginArg,
    input,
    modes,
  });
}

function buildFallbackPlan(input, modes = {}) {
  const text = String(input || "").trim();
  const lower = text.toLowerCase();
  const intent = classifyIntent(text);

  const goalPlan = buildGoalPlan(text, modes);
  if (goalPlan) {
    return { ...goalPlan, intent };
  }

  const writePlan = parseWriteCommand(text);
  if (writePlan) {
    return { ...writePlan, modes, intent };
  }

  const appendPlan = parseAppendCommand(text);
  if (appendPlan) {
    return { ...appendPlan, modes, intent };
  }

  const pluginPlan = parseRunPluginCommand(text, modes);
  if (pluginPlan) {
    return { ...pluginPlan, intent };
  }

  const summarizeAndSaveMatch = text.match(/^summarize\s+(.+?)\s+and\s+save\s+to\s+(.+)$/i);
  if (summarizeAndSaveMatch) {
    return {
      ...makeMultiStep(
        [
          { action: "read_file", payload: summarizeAndSaveMatch[1].trim() },
          { action: "summarize_text", payloadFrom: "previous" },
          { action: "write_file", payload: summarizeAndSaveMatch[2].trim(), contentFrom: "previous" },
        ],
        { modes }
      ),
      intent,
    };
  }

  const readAndSummarizeMatch = text.match(/^read\s+(.+?)\s+and\s+summarize(\s+it)?$/i);
  if (readAndSummarizeMatch) {
    return {
      ...makeMultiStep(
        [
          { action: "read_file", payload: readAndSummarizeMatch[1].trim() },
          { action: "summarize_text", payloadFrom: "previous" },
        ],
        { modes }
      ),
      intent,
    };
  }

  const listAndSaveMatch = text.match(/^list\s+files\s+and\s+save\s+to\s+(.+)$/i);
  if (listAndSaveMatch) {
    return {
      ...makeMultiStep(
        [
          { action: "list_files", payload: "." },
          { action: "write_file", payload: listAndSaveMatch[1].trim(), contentFrom: "previous" },
        ],
        { modes }
      ),
      intent,
    };
  }

  if (lower === "diagnose") {
    return makeSingleStep("diagnose_environment", ".", { modes, intent });
  }

  const diagnoseMatch = text.match(/^diagnose\s+(.+)$/i);
  if (diagnoseMatch) {
    return makeSingleStep("diagnose_path", diagnoseMatch[1].trim(), { modes, intent });
  }

  if (lower === "whyblocked") {
    return makeSingleStep("whyblocked", ".", { modes, intent });
  }

  if (lower === "plugins") {
    return makeSingleStep("list_plugins", ".", { modes, intent });
  }

  if (lower.includes("list files") || lower.includes("show files") || lower.includes("what files")) {
    return makeSingleStep("list_files", ".", { modes, intent });
  }

  if (lower.startsWith("read ")) {
    return makeSingleStep("read_file", text.slice(5).trim(), { modes, intent });
  }

  if (lower.startsWith("summarize ")) {
    return makeSingleStep("summarize_text", text.slice(10).trim(), { modes, intent });
  }

  return makeSingleStep("echo", text, { modes, intent });
}

async function createPlan(input, memory, modes = {}) {
  const intent = classifyIntent(input);

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your_api_key_here") {
    return attachPlannerMetadata(buildFallbackPlan(input, modes), input, modes);
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = `
You are an AI planner for a terminal-based assistant.

Return ONLY valid JSON.

Allowed plan types:
- single
- multi
- goal

Allowed actions:
- echo
- list_files
- read_file
- summarize_text
- write_file
- append_file
- diagnose_environment
- diagnose_path
- whyblocked
- list_plugins
- run_plugin

Single-step shape:
{
  "type": "single",
  "action": "echo" | "list_files" | "read_file" | "summarize_text" | "write_file" | "append_file" | "diagnose_environment" | "diagnose_path" | "whyblocked" | "list_plugins" | "run_plugin",
  "payload": "string",
  "content": "optional string",
  "input": "optional string",
  "pluginArg": "optional string",
  "intent": {
    "category": "chat" | "tool" | "goal" | "plugin" | "diagnostics" | "history" | "empty",
    "confidence": 0.0,
    "reason": "string"
  },
  "source": "ai"
}

Multi-step shape:
{
  "type": "multi",
  "steps": [
    {
      "action": "read_file",
      "payload": "notes.txt"
    },
    {
      "action": "summarize_text",
      "payloadFrom": "previous"
    }
  ],
  "intent": {
    "category": "goal",
    "confidence": 0.0,
    "reason": "string"
  },
  "source": "ai"
}

Goal shape:
{
  "type": "goal",
  "goal": "user request",
  "tasks": ["task 1", "task 2"],
  "steps": [
    {
      "action": "read_file",
      "payload": "notes.txt"
    },
    {
      "action": "summarize_text",
      "payloadFrom": "previous"
    },
    {
      "action": "write_file",
      "payload": "summary.txt",
      "contentFrom": "previous"
    }
  ],
  "intent": {
    "category": "goal",
    "confidence": 0.0,
    "reason": "string"
  },
  "source": "ai"
}

Rules:
- Respect the user request and classify the likely intent
- Use diagnose_environment for "diagnose"
- Use diagnose_path for "diagnose something"
- Use whyblocked for blocked explanation requests
- Use list_plugins for "plugins"
- Use run_plugin for "run plugin X" and put the plugin name in payload
- If plugin arguments are present, put them in pluginArg
- Use goal for larger requests
- Use multi for chained requests
- Use single for one-shot requests
- Return only JSON
`.trim();

    const userPrompt = `
User input: ${input}

Detected intent:
${JSON.stringify(intent, null, 2)}

Modes:
${JSON.stringify(modes, null, 2)}

Recent memory:
${JSON.stringify(memory || {}, null, 2)}
`.trim();

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = response.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return attachPlannerMetadata(buildFallbackPlan(input, modes), input, modes);
    }

    const parsed = JSON.parse(content);

    if (!parsed.type) {
      return attachPlannerMetadata(buildFallbackPlan(input, modes), input, modes);
    }

    return attachPlannerMetadata({
      ...parsed,
      intent: parsed.intent || intent,
      modes,
    }, input, modes);
  } catch (error) {
    return attachPlannerMetadata(buildFallbackPlan(input, modes), input, modes);
  }
}

module.exports = { createPlan };
