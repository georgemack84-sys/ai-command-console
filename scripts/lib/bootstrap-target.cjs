function defaultDatabaseUrl() {
  return "postgresql://postgres:postgres@localhost:55432/ai_command_console?schema=public";
}

function parseDatabaseTarget(databaseUrl = defaultDatabaseUrl()) {
  const parsed = new URL(databaseUrl);
  const databaseName = parsed.pathname.replace(/^\/+/, "").split("/")[0] || "postgres";

  return {
    databaseUrl,
    host: parsed.hostname || "localhost",
    port: Number(parsed.port || 5432),
    databaseName,
  };
}

function isLocalHost(host) {
  return ["localhost", "127.0.0.1", "::1"].includes(String(host || "").toLowerCase());
}

function isSafeLocalBootstrapTarget(target) {
  return isLocalHost(target.host) && target.databaseName === "ai_command_console";
}

module.exports = {
  defaultDatabaseUrl,
  parseDatabaseTarget,
  isSafeLocalBootstrapTarget,
};
