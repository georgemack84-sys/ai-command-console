const path = require("path");
const { loadJsonDocument } = require("./documentStore");

const aliasesPath = path.join(__dirname, "../config/aliases.json");
const ALIASES_KEY = "config.aliases";

function loadAliasConfig() {
  try {
    return loadJsonDocument(ALIASES_KEY, aliasesPath, { aliases: {} }, (value) => ({
      aliases: value?.aliases && typeof value.aliases === "object" ? value.aliases : {},
    }));
  } catch (error) {
    return { aliases: {} };
  }
}

function getAliases() {
  const config = loadAliasConfig();
  return config.aliases || {};
}

function resolveAlias(input) {
  const text = String(input || "").trim();
  if (!text) {
    return {
      original: text,
      resolved: text,
      changed: false,
      aliasUsed: null,
    };
  }

  const aliases = getAliases();
  const parts = text.split(/\s+/);
  const first = parts[0];
  const rest = parts.slice(1).join(" ");

  if (!aliases[first]) {
    return {
      original: text,
      resolved: text,
      changed: false,
      aliasUsed: null,
    };
  }

  let resolved = aliases[first];

  if (rest) {
    resolved = `${resolved} ${rest}`.trim();
  }

  return {
    original: text,
    resolved,
    changed: resolved !== text,
    aliasUsed: first,
  };
}

module.exports = {
  loadAliasConfig,
  getAliases,
  resolveAlias,
};
