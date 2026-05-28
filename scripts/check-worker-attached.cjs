#!/usr/bin/env node

const http = require("http");

const baseUrl = process.env.DEV_WORKER_CHECK_BASE_URL || "http://127.0.0.1:3000";

function request(pathname) {
  return new Promise((resolve, reject) => {
    const req = http.request(`${baseUrl}${pathname}`, { method: "GET" }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        try {
          resolve({
            statusCode: response.statusCode || 0,
            payload: JSON.parse(body || "{}"),
          });
        } catch (error) {
          reject(error);
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function main() {
  const [ready, health] = await Promise.all([request("/api/ready"), request("/api/health")]);
  const readyData = ready.payload?.data || {};
  const healthData = health.payload?.data || {};
  const jobs = readyData?.checks?.jobs || healthData?.checks?.jobs || {};
  const activeWorkers = Number(jobs.activeWorkers || 0);
  const queue = {
    queued: Number(jobs.queued || 0),
    running: Number(jobs.running || 0),
    scheduledRetries: Number(jobs.scheduledRetries || 0),
    pending: Number(jobs.pending || Number(jobs.queued || 0) + Number(jobs.scheduledRetries || 0)),
  };

  const report = {
    baseUrl,
    ready: readyData?.status || "unknown",
    health: healthData?.status || "unknown",
    activeWorkers,
    queue,
    signal: activeWorkers >= 1 ? "WORKER_ATTACHED" : "WORKER_NOT_ATTACHED",
  };

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exit(activeWorkers >= 1 ? 0 : 1);
}

main().catch((error) => {
  process.stderr.write(
    `${JSON.stringify(
      {
        baseUrl,
        signal: "WORKER_CHECK_FAILED",
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    )}\n`,
  );
  process.exit(1);
});
