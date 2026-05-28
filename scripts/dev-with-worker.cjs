#!/usr/bin/env node

const { spawn } = require("child_process");
const readline = require("readline");

const root = process.cwd();
const children = new Map();
let shuttingDown = false;
let exitCode = 0;
const devPort = String(Number(process.env.AI_COMMAND_CONSOLE_DEV_WITH_WORKER_PORT || 3000) || 3000);

function getCommandSpec(args) {
  if (process.platform === "win32") {
    return {
      command: "cmd.exe",
      args: ["/d", "/s", "/c", `npm ${args.join(" ")}`],
    };
  }

  return {
    command: "npm",
    args,
  };
}

function prefixStream(stream, label, writer) {
  const rl = readline.createInterface({ input: stream });
  rl.on("line", (line) => writer.write(`[${label}] ${line}\n`));
  rl.on("close", () => {
    if (!stream.readableEnded) {
      writer.write(`[${label}] <stream closed>\n`);
    }
  });
}

function terminateChildren(signal = "SIGTERM") {
  for (const child of children.values()) {
    if (child.exitCode == null && child.signalCode == null) {
      try {
        child.kill(signal);
      } catch {}
    }
  }
}

function finalize(code) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  exitCode = code;
  terminateChildren("SIGTERM");
  setTimeout(() => terminateChildren("SIGKILL"), 4_000).unref();
}

function spawnManaged(name, args) {
  const commandSpec = getCommandSpec(args);
  process.stdout.write(`[${name}] starting: ${commandSpec.command} ${commandSpec.args.join(" ")}\n`);
  const child = spawn(commandSpec.command, commandSpec.args, {
    cwd: root,
    env: {
      ...process.env,
      AI_COMMAND_CONSOLE_DEV: "1",
    },
    stdio: ["inherit", "pipe", "pipe"],
  });

  children.set(name, child);
  prefixStream(child.stdout, name, process.stdout);
  prefixStream(child.stderr, name, process.stderr);

  child.on("error", (error) => {
    process.stderr.write(`[${name}] failed to start: ${error instanceof Error ? error.message : String(error)}\n`);
    finalize(1);
  });

  child.on("exit", (code, signal) => {
    children.delete(name);
    const detail = signal ? `signal ${signal}` : `code ${code ?? 0}`;
    process.stderr.write(`[${name}] exited with ${detail}\n`);
    if (!shuttingDown) {
      finalize(code ?? (signal ? 1 : 0) ?? 1);
      return;
    }
    if (!children.size) {
      process.exit(exitCode);
    }
  });

  return child;
}

process.on("SIGINT", () => finalize(130));
process.on("SIGTERM", () => finalize(143));

spawnManaged("app", ["run", "dev", "--", "--port", devPort]);
spawnManaged("worker", ["run", "worker:jobs"]);
