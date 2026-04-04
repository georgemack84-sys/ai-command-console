function getGeneralHelp() {
  return [
    "=== AI Command Console Help ===",
    "",
    "Core Commands:",
    "- help",
    "- help queue",
    "- help macros",
    "- help plugins",
    "- help status",
    "- help aliases",
    "- help startup",
    "- what can you do",
    "",
    "Common Actions:",
    "- list files",
    "- read <file>",
    "- summarize <text or file target>",
    "- write <file>: <content>",
    "- append <file>: <content>",
    "",
    "Operator Features:",
    "- queue add <command>",
    "- run next",
    "- macro save <name> = <command>",
    "- macro run <name>",
    "- plugins",
    "- run plugin <name>",
    "- status",
    "",
    "Shortcuts:",
    "- ls",
    "- cat <file>",
    "- sum <text>",
    "- st",
    "- q",
    "",
    "Type 'help <topic>' for focused guidance."
  ].join("\n");
}

function getQueueHelp() {
  return [
    "=== Help: Queue ===",
    "- queue",
    "- queue pending",
    "- queue done",
    "- queue failed",
    "- queue summary",
    "- queue add <command>",
    "- run next",
    "- run task <id>",
    "- retry task <id>",
    "- remove task <id>",
    "- whyfailed <id>",
    "- clear queue",
    "",
    "Examples:",
    "- queue add list files",
    "- queue add analyze cli.js and make a summary file",
    "- run next"
  ].join("\n");
}

function getMacroHelp() {
  return [
    "=== Help: Macros ===",
    "- macro list",
    "- macro save <name> = <command>",
    "- macro run <name>",
    "- macro remove <name>",
    "",
    "Examples:",
    "- macro save dailycheck = status health",
    "- macro save quickscan = ls",
    "- macro run dailycheck"
  ].join("\n");
}

function getPluginHelp() {
  return [
    "=== Help: Plugins ===",
    "- plugins",
    "- run plugin <name>",
    "- run plugin <name> <optional-argument>",
    "",
    "Examples:",
    "- plugins",
    "- run plugin helloPlugin",
    "- run plugin projectReportPlugin",
    "- run plugin projectReportPlugin .\\services"
  ].join("\n");
}

function getStatusHelp() {
  return [
    "=== Help: Status ===",
    "- status",
    "- status queue",
    "- status memory",
    "- status plugins",
    "- status health",
    "",
    "Use these to inspect the overall system state."
  ].join("\n");
}

function getAliasHelp() {
  return [
    "=== Help: Aliases ===",
    "Configured in config\\aliases.json",
    "",
    "Default aliases:",
    "- ls -> list files",
    "- cat -> read",
    "- sum -> summarize",
    "- st -> status",
    "- q -> queue",
    "- qp -> queue pending",
    "- qd -> queue done",
    "- qf -> queue failed",
    "- qs -> queue summary",
    "",
    "Examples:",
    "- ls",
    "- cat cli.js",
    "- sum AI Command Console"
  ].join("\n");
}

function getStartupHelp() {
  return [
    "=== Help: Startup Automation ===",
    "Configured in config\\startup.json",
    "",
    "Settings:",
    "- showDashboard",
    "- autoRunNextTask",
    "- startupMacros",
    "- safeModeOnStartupAutomation",
    "",
    "Example:",
    "{",
    '  "showDashboard": true,',
    '  "autoRunNextTask": false,',
    '  "startupMacros": ["dailycheck"],',
    '  "safeModeOnStartupAutomation": true',
    "}"
  ].join("\n");
}

function getCapabilitiesHelp() {
  return [
    "=== What I Can Do ===",
    "- Read, summarize, write, and append files",
    "- Build multi-step plans",
    "- Execute goal-oriented workflows",
    "- Track command history",
    "- Maintain memory between runs",
    "- Queue tasks for later execution",
    "- Run plugins",
    "- Save and run macros",
    "- Show system status and diagnostics",
    "- Explain blocked or failed actions"
  ].join("\n");
}

function getHelp(topic = "") {
  const key = String(topic || "").trim().toLowerCase();

  if (!key) return getGeneralHelp();
  if (key === "queue") return getQueueHelp();
  if (key === "macros" || key === "macro") return getMacroHelp();
  if (key === "plugins" || key === "plugin") return getPluginHelp();
  if (key === "status") return getStatusHelp();
  if (key === "aliases" || key === "alias") return getAliasHelp();
  if (key === "startup") return getStartupHelp();
  if (key === "what can you do" || key === "capabilities") return getCapabilitiesHelp();

  return [
    `No help topic found for: ${topic}`,
    "Try:",
    "- help",
    "- help queue",
    "- help macros",
    "- help plugins",
    "- help status",
    "- help aliases",
    "- help startup"
  ].join("\n");
}

module.exports = {
  getHelp,
};