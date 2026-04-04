const listFiles = require("../tools/list_files");
const readFile = require("../tools/read_file");
const writeFile = require("../tools/write_file");
const appendFile = require("../tools/append_file");
const summarizeText = require("../tools/summarize_text");
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