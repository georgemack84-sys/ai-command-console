function parseModes(input) {
  const text = String(input || "");

  return {
    safe: text.includes("--safe"),
    debug: text.includes("--debug"),
    dryRun: text.includes("--dry-run"),
    explain: text.includes("--explain"),
  };
}

function stripModes(input) {
  return String(input || "")
    .replace(/--safe/g, "")
    .replace(/--debug/g, "")
    .replace(/--dry-run/g, "")
    .replace(/--explain/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

module.exports = {
  parseModes,
  stripModes,
};