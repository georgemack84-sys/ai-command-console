#!/usr/bin/env node

const http = require("http");

const baseUrl = process.env.DEV_CHURN_BASE_URL || "http://127.0.0.1:3000";
const rounds = Number(process.env.DEV_CHURN_ROUNDS || 4);
const delayMs = Number(process.env.DEV_CHURN_DELAY_MS || 1000);
const protectedRoutes = ["/dashboard", "/console", "/platform", "/operations", "/recovery"];
const cycleRoutes = ["/", "/auth", ...protectedRoutes];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function request(pathname, options = {}) {
  const body = options.body ? Buffer.from(options.body, "utf8") : null;
  const headers = {
    ...(options.headers || {}),
  };
  if (body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (body) {
    headers["Content-Length"] = String(body.length);
  }

  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const requestHandle = http.request(
      `${baseUrl}${pathname}`,
      {
        method: options.method || "GET",
        headers,
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          resolve({
            path: pathname,
            status: response.statusCode || 0,
            headers: response.headers,
            body: Buffer.concat(chunks).toString("utf8"),
            durationMs: Date.now() - startedAt,
          });
        });
      },
    );

    requestHandle.on("error", reject);
    if (body) {
      requestHandle.write(body);
    }
    requestHandle.end();
  });
}

function collectCookie(headers) {
  const raw = headers["set-cookie"];
  if (!raw) {
    return null;
  }
  const values = Array.isArray(raw) ? raw : [raw];
  const serialized = values.map((value) => String(value).split(";")[0]).filter(Boolean);
  return serialized.length ? serialized.join("; ") : null;
}

function isAuthRedirect(location) {
  return typeof location === "string" && location.startsWith("/auth");
}

async function getReadySnapshot() {
  const payload = await request("/api/ready");
  return JSON.parse(payload.body || "{}");
}

async function runAuthFlow(cookieHeader = null) {
  const report = [];
  for (const route of protectedRoutes) {
    const response = await request(route, {
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    });
    report.push({
      route,
      status: response.status,
      location: response.headers.location || null,
      durationMs: response.durationMs,
      authState: cookieHeader ? "session_present" : "no_session",
      redirectSource:
        response.status >= 300 && response.status < 400 && isAuthRedirect(response.headers.location)
          ? "server_redirect_guard"
          : null,
    });
  }
  return report;
}

function classifyMemory(samples) {
  const rss = samples
    .map((sample) => Number(sample.memory?.rssMb || 0))
    .filter((value) => Number.isFinite(value) && value > 0);
  if (!rss.length) {
    return { classification: "insufficient_data", slopeMb: 0, deltaMb: 0 };
  }

  const first = rss[0];
  const last = rss[rss.length - 1];
  const max = Math.max(...rss);
  const min = Math.min(...rss);
  const deltaMb = last - first;
  const slopeMb = max - min;
  const monotonic = rss.every((value, index) => index === 0 || value >= rss[index - 1]);

  if (monotonic && deltaMb >= 80) {
    return { classification: "potential_leak_or_retention", slopeMb, deltaMb };
  }
  if (slopeMb >= 120 && Math.abs(deltaMb) <= 40) {
    return { classification: "framework_retention_with_recovery", slopeMb, deltaMb };
  }
  if (slopeMb >= 60) {
    return { classification: "route_churn_spikes", slopeMb, deltaMb };
  }
  return { classification: "stable", slopeMb, deltaMb };
}

function classifyRouteChurn(routeTimings) {
  return routeTimings.map((entry) => {
    const durations = entry.samples.map((sample) => sample.durationMs);
    const [first, ...rest] = durations;
    const averageRest = rest.length ? rest.reduce((sum, value) => sum + value, 0) / rest.length : first;
    const probableCompileCost = first > averageRest * 1.5 && first - averageRest >= 150;

    return {
      route: entry.route,
      firstHitMs: first,
      averageRepeatMs: Math.round(averageRest),
      probableCompileCost,
      statuses: entry.samples.map((sample) => sample.status),
    };
  });
}

async function main() {
  const unauthenticated = await runAuthFlow(null);

  const login = await request("/api/auth/dev-login", { method: "POST" });
  const authCookie = collectCookie(login.headers);
  const authenticated = authCookie ? await runAuthFlow(authCookie) : [];

  const roundsData = [];
  for (let round = 1; round <= rounds; round += 1) {
    let currentCookie = authCookie;
    if (currentCookie) {
      const refresh = await request("/api/auth/dev-login", { method: "POST", headers: { Cookie: currentCookie } });
      currentCookie = collectCookie(refresh.headers) || currentCookie;
    }

    const routeResults = [];
    for (const route of cycleRoutes) {
      const response = await request(route, {
        headers: currentCookie && route !== "/auth" ? { Cookie: currentCookie } : undefined,
      });
      routeResults.push({
        route,
        status: response.status,
        location: response.headers.location || null,
        durationMs: response.durationMs,
      });
    }

    const ready = await getReadySnapshot();
    roundsData.push({
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

  const routeTimings = cycleRoutes.map((route) => ({
    route,
    samples: roundsData.map((round) => round.routeResults.find((entry) => entry.route === route)).filter(Boolean),
  }));

  const authRedirectsExpected = unauthenticated.every(
    (entry) => entry.status === 307 && isAuthRedirect(entry.location),
  );
  const authenticatedProtectedOk = authenticated.every(
    (entry) => entry.status === 200 || (entry.status >= 300 && entry.status < 400 && !isAuthRedirect(entry.location)),
  );
  const memory = classifyMemory(roundsData);
  const churn = classifyRouteChurn(routeTimings);
  const hasProbableCompileCost = churn.some((entry) => entry.probableCompileCost);

  let overallClassification = "clean_system";
  if (!authRedirectsExpected || !authenticatedProtectedOk) {
    overallClassification = "application_induced_churn";
  } else if (memory.classification === "potential_leak_or_retention") {
    overallClassification = "mixed_source_instability";
  } else if (memory.classification === "route_churn_spikes" || hasProbableCompileCost) {
    overallClassification = "framework_dominant_behavior";
  }

  const report = {
    ok: true,
    baseUrl,
    generatedAt: new Date().toISOString(),
    login: {
      status: login.status,
      cookieAcquired: Boolean(authCookie),
    },
    unauthenticated,
    authenticated,
    rounds: roundsData,
    memory,
    routeChurn: churn,
    authFlowAssessment: {
      authRedirectsExpected,
      authenticatedProtectedOk,
      redirectSource: "server_redirect_guard",
    },
    overallClassification,
  };

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(
    `${JSON.stringify({ ok: false, baseUrl, error: error instanceof Error ? error.message : String(error) }, null, 2)}\n`,
  );
  process.exit(1);
});
