#!/usr/bin/env node

const http = require("http");

const baseUrl = process.env.DEV_RUNTIME_PROFILE_BASE_URL || "http://127.0.0.1:3000";
const rounds = Number(process.env.DEV_RUNTIME_PROFILE_ROUNDS || 4);
const delayMs = Number(process.env.DEV_RUNTIME_PROFILE_DELAY_MS || 1000);
const routes = ["/", "/dashboard", "/console", "/platform", "/operations", "/recovery"];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requestJson(pathname) {
  return new Promise((resolve, reject) => {
    const request = http.get(`${baseUrl}${pathname}`, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });

    request.on("error", reject);
  });
}

function requestRoute(pathname) {
  return new Promise((resolve) => {
    const request = http.get(`${baseUrl}${pathname}`, (response) => {
      response.resume();
      response.on("end", () => resolve({ path: pathname, status: response.statusCode || 0 }));
    });

    request.on("error", (error) => resolve({ path: pathname, status: 0, error: error.message }));
  });
}

async function run() {
  const samples = [];

  for (let round = 1; round <= rounds; round += 1) {
    const routeResults = [];
    for (const route of routes) {
      routeResults.push(await requestRoute(route));
    }

    const ready = await requestJson("/api/ready");
    samples.push({
      round,
      routeResults,
      status: ready?.data?.status || "unknown",
      memory: ready?.data?.runtime?.process?.memory || null,
      warnings: ready?.data?.warnings || [],
    });

    if (round < rounds) {
      await sleep(delayMs);
    }
  }

  const summary = {
    ok: true,
    baseUrl,
    rounds,
    routes,
    samples,
  };

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

run().catch((error) => {
  process.stderr.write(
    `${JSON.stringify({ ok: false, baseUrl, error: error instanceof Error ? error.message : String(error) }, null, 2)}\n`,
  );
  process.exit(1);
});
