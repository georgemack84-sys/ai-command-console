const { clearJobs } = require("../services/jobQueue");

const baseUrl = process.env.STRESS_BASE_URL || "http://localhost:5050";
const email = process.env.STRESS_EMAIL || "showcase@pulse.local";
const password = process.env.STRESS_PASSWORD || "Launchpad-Admin-2026";
const readCount = Number(process.env.STRESS_READ_COUNT || 240);
const readConcurrency = Number(process.env.STRESS_READ_CONCURRENCY || 32);
const queueCount = Number(process.env.STRESS_QUEUE_COUNT || 240);
const queueConcurrency = Number(process.env.STRESS_QUEUE_CONCURRENCY || 24);
const pollCount = Number(process.env.STRESS_POLL_COUNT || 60);
const pollConcurrency = Number(process.env.STRESS_POLL_CONCURRENCY || 12);
const settleMs = Number(process.env.STRESS_SETTLE_MS || 5000);
const maxPollP95Ms = Number(process.env.STRESS_MAX_POLL_P95_MS || 1500);
const maxReadyP95Ms = Number(process.env.STRESS_MAX_READY_MS || 1500);
const maxSettledRssMb = Number(process.env.STRESS_MAX_SETTLED_RSS_MB || 1400);

async function login() {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const setCookie = response.headers.get("set-cookie") || "";
  if (!response.ok || !setCookie) {
    throw new Error(`Login failed (${response.status}): ${await response.text()}`);
  }

  return setCookie.split(";")[0];
}

async function readReady(cookie) {
  const start = Date.now();
  const response = await fetch(`${baseUrl}/api/ready`, {
    headers: { cookie },
  });
  const payload = await response.json();

  return {
    status: response.status,
    ms: Date.now() - start,
    payload,
  };
}

async function runLoad(count, concurrency, task) {
  const results = [];
  let index = 0;

  async function worker() {
    while (true) {
      const current = index++;
      if (current >= count) {
        return;
      }

      const start = Date.now();
      try {
        const value = await task(current);
        results.push({ ok: true, ms: Date.now() - start, value });
      } catch (error) {
        results.push({ ok: false, ms: Date.now() - start, error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const durations = results.map((result) => result.ms).sort((a, b) => a - b);
  const percentile = (p) => durations[Math.min(durations.length - 1, Math.floor(durations.length * p))] || 0;

  return {
    ok: results.filter((result) => result.ok).length,
    failed: results.filter((result) => !result.ok).length,
    p50Ms: percentile(0.5),
    p95Ms: percentile(0.95),
    p99Ms: percentile(0.99),
    statusCounts: results.reduce((acc, result) => {
      const key = result.ok ? String(result.value?.status || "ok") : "ERR";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
    sampleErrors: results.filter((result) => !result.ok).slice(0, 5).map((result) => result.error),
  };
}

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  clearJobs();
  const cookie = await login();
  const headers = { cookie, "content-type": "application/json" };
  const before = await readReady(cookie);

  const readRamp = await runLoad(readCount, readConcurrency, async (index) => {
    const paths = ["/api/dashboard", "/api/control-center/overview", "/api/admin/access", "/api/jobs?limit=20", "/api/workspace", "/api/ready"];
    const response = await fetch(`${baseUrl}${paths[index % paths.length]}`, { headers: { cookie } });
    if (!response.ok) {
      throw new Error(`${response.status}`);
    }
    return { status: response.status };
  });

  const queueRun = await runLoad(queueCount, queueConcurrency, async (index) => {
    const body = index % 4 === 0 ? { type: "workspace:failure-drill" } : { type: "workspace:generate-insights" };
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`${response.status}`);
    }
    return { status: response.status };
  });

  const pollRun = await runLoad(pollCount, pollConcurrency, async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${baseUrl}/api/jobs?limit=20`, {
        headers: { cookie },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`${response.status}`);
      }
      return { status: response.status };
    } finally {
      clearTimeout(timer);
    }
  });

  await new Promise((resolve) => setTimeout(resolve, settleMs));

  const after = await readReady(cookie);
  const jobsResponse = await fetch(`${baseUrl}/api/jobs?limit=20`, { headers: { cookie } });
  const jobsPayload = await jobsResponse.json();
  const report = {
    before: before.payload?.data?.runtime?.process?.memory || null,
    after: after.payload?.data?.runtime?.process?.memory || null,
    readRamp,
    queueRun,
    pollRun,
    ready: {
      status: after.payload?.data?.status || null,
      ms: after.ms,
      warnings: after.payload?.data?.warnings || [],
    },
    health: jobsPayload?.data?.health || null,
  };

  console.log(JSON.stringify(report, null, 2));

  assertCondition(readRamp.failed === 0, "Read ramp produced failures.");
  assertCondition(pollRun.failed === 0, "Jobs polling produced failures.");
  assertCondition(pollRun.p95Ms <= maxPollP95Ms, `Jobs polling p95 ${pollRun.p95Ms}ms exceeded ${maxPollP95Ms}ms.`);
  assertCondition(after.ms <= maxReadyP95Ms, `Ready probe ${after.ms}ms exceeded ${maxReadyP95Ms}ms.`);
  assertCondition(["ready", "ready_with_warnings"].includes(String(after.payload?.data?.status || "")), "Readiness did not recover.");
  assertCondition(!(jobsPayload?.data?.health?.unhealthy), "Queue health remained unhealthy after settling.");
  assertCondition(Number(after.payload?.data?.runtime?.process?.memory?.rssMb || 0) <= maxSettledRssMb, "Settled RSS exceeded memory threshold.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
