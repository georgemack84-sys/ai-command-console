const net = require("net");
const path = require("path");
const { spawnSync } = require("child_process");
const dotenv = require("dotenv");
const { resolveVaultE2eDatabaseUrl } = require("./lib/vault-e2e-database.cjs");

dotenv.config({ path: path.join(process.cwd(), ".env"), quiet: true });
dotenv.config({ path: path.join(process.cwd(), ".env.local"), override: true, quiet: true });
const databaseUrl = resolveVaultE2eDatabaseUrl();

function canConnect(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let complete = false;
    const finish = (ok) => {
      if (complete) return;
      complete = true;
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(1_500);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
    socket.connect(port, host);
  });
}

function run(command, args, env) {
  const result = spawnSync(command, args, { cwd: process.cwd(), env, encoding: "utf8", stdio: "pipe" });
  if (result.error || (result.status ?? 1) !== 0) {
    const output = [result.stdout, result.stderr]
      .filter((value) => typeof value === "string" && value.trim())
      .join("\n")
      .slice(-8_000);
    throw new Error(
      `${command} ${args.join(" ")} failed while preparing the Vault E2E database ` +
      `(exit ${result.status ?? "unknown"}${result.error ? `; ${result.error.message}` : ""}).${output ? `\n\n${output}` : ""}`,
    );
  }
}

module.exports = async function vaultE2eGlobalSetup() {
  const target = new URL(databaseUrl);
  const host = target.hostname;
  const port = Number(target.port || 5432);
  const env = { ...process.env, DATABASE_URL: databaseUrl };

  if (!(await canConnect(host, port)) && process.platform === "win32") {
    const bootstrap = path.join(process.cwd(), "scripts", "dev-postgres-windows.ps1");
    spawnSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", bootstrap, "-StartOnly"], {
      cwd: process.cwd(),
      env,
      stdio: "inherit",
    });
  }

  if (!(await canConnect(host, port))) {
    throw new Error(
      `Vault E2E requires PostgreSQL at ${host}:${port}. Start it with .\\scripts\\dev-postgres-windows.ps1 -StartOnly, then retry.`,
    );
  }

  // Avoid npx.cmd here: Playwright global setup runs in a child process and
  // Windows command shims can fail without forwarding Prisma's diagnostics.
  const prismaCli = require.resolve("prisma/build/index.js");
  run(process.execPath, [prismaCli, "migrate", "deploy"], env);
  run(process.execPath, [prismaCli, "db", "seed"], env);
};
