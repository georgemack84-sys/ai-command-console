// Narrow compatibility adapter around the remaining legacy console helpers.
// Keep new runtime code depending on this tiny surface instead of importing
// the full consoleApi module directly.
const {
  queueDueDigestSweepIfNeeded,
  formatLegacyConsoleHelp,
} = require("./legacyConsoleHandler");
const { recordLegacyConsoleUsage } = require("./legacyConsoleUsage");

function queueLegacyDueDigestSweepIfNeeded(...args) {
  recordLegacyConsoleUsage({
    surface: "scheduler",
    action: "queueDueDigestSweepIfNeeded",
  });
  return queueDueDigestSweepIfNeeded(...args);
}

function formatLegacyHelp(...args) {
  recordLegacyConsoleUsage({
    surface: "terminal",
    action: "help",
  });
  return formatLegacyConsoleHelp(...args);
}

module.exports = {
  queueLegacyDueDigestSweepIfNeeded,
  formatLegacyConsoleHelp: formatLegacyHelp,
};
