const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@localhost:55432/ai_command_console?schema=public";
const PLAYWRIGHT_DATABASE_NAME = "ai_command_console_playwright";

function resolveVaultE2eDatabaseUrl() {
  if (process.env.PLAYWRIGHT_DATABASE_URL?.trim()) {
    return process.env.PLAYWRIGHT_DATABASE_URL.trim();
  }

  const source = process.env.DATABASE_URL?.trim() || DEFAULT_DATABASE_URL;
  const target = new URL(source);
  target.pathname = `/${PLAYWRIGHT_DATABASE_NAME}`;
  return target.toString();
}

module.exports = { PLAYWRIGHT_DATABASE_NAME, resolveVaultE2eDatabaseUrl };
