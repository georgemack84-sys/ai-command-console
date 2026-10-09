import { createRequire } from "node:module";
import {
  formatTerminalInboxDigest,
  formatTerminalInboxHistory,
  formatTerminalInboxList,
  formatTerminalTrustReport,
} from "@/src/server/services/terminal-collaboration-read-service";

const require = createRequire(import.meta.url);
const { formatLegacyConsoleHelp } = require("../../../services/legacyConsoleCompat");

const terminalReadCommands = new Set(["help", "inbox:list", "inbox:digest", "inbox:history", "trust:report"]);

export function canHandleTerminalReadCommand(command: string) {
  return terminalReadCommands.has(String(command || "").trim());
}

export function executeTerminalReadCommand(command: string, overview: Record<string, unknown>) {
  switch (String(command || "").trim()) {
    case "help":
      return formatLegacyConsoleHelp();
    case "inbox:list":
      return formatTerminalInboxList(overview);
    case "inbox:digest":
      return formatTerminalInboxDigest(overview);
    case "inbox:history":
      return formatTerminalInboxHistory(overview);
    case "trust:report":
      return formatTerminalTrustReport(overview);
    default:
      return null;
  }
}
