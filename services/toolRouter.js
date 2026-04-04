const listFiles = require("../tools/list_files");
const readFile = require("../tools/read_file");
const writeFile = require("../tools/write_file");
const appendFile = require("../tools/append_file");
const summarizeText = require("../tools/summarize_text");
const memory = require("./memory");
const historyService = require("./history");
const { diagnoseEnvironment, diagnosePath, formatDiagnosticReport } = require("./diagnostics");
const { explainWhyBlocked, formatWhyBlocked } = require("./whyBlocked");
const { listPlugins, runPlugin } = require("./pluginLoader");
const { logAction } = require("./logger");

async function route(plan, modes = {}) {
  if (modes.safe && (plan.action === "write_file" || plan.action === "append_file")) {
    return `[SAFE MODE] Blocked ${plan.action} action for payload "${plan.payload}"`;
  }

  let result;

  switch (plan.action) {
    case "echo":
      result = `Echo: ${plan.payload}`;
      break;

    case "list_files":
      result = await listFiles(plan.payload || ".");
      break;

    case "read_file":
      result = await readFile(plan.payload);
      break;

    case "write_file":
      result = await writeFile(plan.payload, plan.content || "");
      break;

    case "append_file":
      result = await appendFile(plan.payload, plan.content || "");
      break;

    case "summarize_text":
      result = await summarizeText(plan.payload);
      break;

    case "diagnose_environment":
      result = formatDiagnosticReport(diagnoseEnvironment());
      break;

    case "diagnose_path":
      result = formatDiagnosticReport(diagnosePath(plan.payload));
      break;

    case "whyblocked":
      result = formatWhyBlocked(
        explainWhyBlocked(memory.loadMemory(), historyService.loadHistory())
      );
      break;

    case "list_plugins": {
      const plugins = listPlugins();
      result = [
        "=== Plugins ===",
        ...plugins.map((p) =>
          `- ${p.name} | loaded=${p.loaded} | ${p.description}${p.error ? ` | error=${p.error}` : ""}`
        ),
      ].join("\n");
      break;
    }

    case "run_plugin":
      result = await runPlugin(plan.payload, {
        input: plan.input || `run plugin ${plan.payload}`,
        payload: plan.pluginArg || "",
        pluginArg: plan.pluginArg || "",
        modes,
      });
      break;

    default:
      result = `Unknown action: ${plan.action}`;
      break;
  }

  logAction({
    action: plan.action,
    payload: plan.payload,
    source: plan.source || "unknown",
    safeMode: !!modes.safe,
    dryRun: !!modes.dryRun,
    explain: !!modes.explain,
    debug: !!modes.debug,
    resultPreview: String(result).slice(0, 200),
  });

  return result;
}

module.exports = { route };