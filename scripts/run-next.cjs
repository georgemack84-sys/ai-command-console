#!/usr/bin/env node

const { spawnSync } = require("child_process");
const path = require("path");

const [, , command = "dev", ...args] = process.argv;

if (command === "dev") {
  process.env.NODE_ENV = "development";
} else {
  process.env.NODE_ENV = "production";
}

if (command === "start") {
  const preflight = spawnSync(process.execPath, [path.join(__dirname, "preflight.cjs")], {
    stdio: "inherit",
    env: process.env,
  });

  if ((preflight.status ?? 1) !== 0) {
    process.exit(preflight.status ?? 1);
  }
}

if (command === "dev") {
  console.log("Dev note: run `npm run dev:doctor` if Prisma-backed routes fail or local auth cannot connect to Postgres.");
}

const nextBin = require.resolve("next/dist/bin/next");
const result = spawnSync(process.execPath, [nextBin, command, ...args], {
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
