#!/usr/bin/env node

const { spawn } = require("child_process");
const { join } = require("path");

const child = spawn(process.execPath, [join(__dirname, "run-next.cjs"), "dev", "--webpack"], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

for (const event of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(event, () => {
    if (!child.killed) {
      child.kill(event);
    }
  });
}
