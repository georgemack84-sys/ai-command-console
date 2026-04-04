#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { randomUUID, scryptSync } = require("node:crypto");
const { saveCollaborationState, updateDigestWorkspaceState, createApprovalRequest } = require("../services/collaboration");
const { saveQueue } = require("../services/taskQueue");
const { saveAlertsState } = require("../services/alerts");
const { saveSchedulerState } = require("../services/scheduler");
const { clearAuditEvents } = require("../services/auditTrail");
const { clearTelemetry } = require("../services/telemetry");
const { clearJobs } = require("../services/jobQueue");
const { buildDemoScenarioSeed, getScenarioMeta } = require("../services/demoScenario");

const root = process.cwd();
const requestedScenario = process.argv[2] || "control-plane";
const usersPath = path.join(root, "data", "flowwatch-users.json");
const userRoutesPath = path.join(root, "data", "flowwatch-user-routes.json");
const trafficStatePath = path.join(root, "data", "flowwatch-traffic-state.json");
const trafficSeedPath = path.join(root, "data", "flowwatch-traffic-seed.json");
const demoRoutesPath = path.join(root, "data", "flowwatch-demo-routes.json");
const researchBriefsPath = path.join(root, "data", "research-briefs.json");
const researchReportsPath = path.join(root, "data", "research-reports.json");

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function createPasswordHash(password) {
  const salt = randomUUID();
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

const now = new Date();
const demoRoutes = JSON.parse(fs.readFileSync(demoRoutesPath, "utf8"));
const trafficSeed = fs.readFileSync(trafficSeedPath, "utf8");

const demoUsers = [
  {
    id: randomUUID(),
    email: "demo.user@example.com",
    passwordHash: createPasswordHash("demo12345"),
    name: "Demo User",
    role: "admin",
    status: "active",
    workspaceId: "default",
    workspaceName: "Main Workspace",
    createdAt: now.toISOString(),
  },
  {
    id: randomUUID(),
    email: "morgan.ops@example.com",
    passwordHash: createPasswordHash("demo12345"),
    name: "Morgan Ops",
    role: "operator",
    status: "active",
    workspaceId: "ws-prod-redwood",
    workspaceName: "Production Redwood",
    createdAt: now.toISOString(),
  },
  {
    id: randomUUID(),
    email: "pat.approver@example.com",
    passwordHash: createPasswordHash("demo12345"),
    name: "Pat Approver",
    role: "approver",
    status: "active",
    workspaceId: "ws-prod-redwood",
    workspaceName: "Production Redwood",
    createdAt: now.toISOString(),
  },
  {
    id: randomUUID(),
    email: "jamie.staging@example.com",
    passwordHash: createPasswordHash("demo12345"),
    name: "Jamie Staging",
    role: "operator",
    status: "active",
    workspaceId: "ws-staging-orbit",
    workspaceName: "Staging Orbit",
    createdAt: now.toISOString(),
  },
  {
    id: randomUUID(),
    email: "alex.labs@example.com",
    passwordHash: createPasswordHash("demo12345"),
    name: "Alex Labs",
    role: "operator",
    status: "active",
    workspaceId: "ws-labs-signal",
    workspaceName: "Labs Signal",
    createdAt: now.toISOString(),
  },
];

const [demoAdmin, prodOperator, prodApprover, stagingOperator, labsOperator] = demoUsers;
const scenarioMeta = getScenarioMeta(requestedScenario);
const scenarioSeed = buildDemoScenarioSeed(
  scenarioMeta.id,
  { demoAdmin, prodOperator, prodApprover, stagingOperator, labsOperator },
  now
);

writeJson(usersPath, demoUsers);
writeJson(userRoutesPath, {
  default: demoRoutes.map((route, index) => ({
    ...route,
    ownerId: index === 0 ? demoAdmin.id : undefined,
    ownerName: index === 0 ? demoAdmin.name : undefined,
  })),
  "ws-prod-redwood": demoRoutes.map((route, index) => ({
    ...route,
    id: `${route.id}-prod-${index}`,
    label: `${route.label} (Prod)`,
    ownerId: prodOperator.id,
    ownerName: prodOperator.name,
  })),
  "ws-staging-orbit": demoRoutes.map((route, index) => ({
    ...route,
    id: `${route.id}-staging-${index}`,
    label: `${route.label} (Staging)`,
    ownerId: stagingOperator.id,
    ownerName: stagingOperator.name,
  })),
  "ws-labs-signal": demoRoutes.map((route, index) => ({
    ...route,
    id: `${route.id}-labs-${index}`,
    label: `${route.label} (Labs)`,
    ownerId: index === 0 ? labsOperator.id : undefined,
    ownerName: index === 0 ? labsOperator.name : undefined,
  })),
});
fs.writeFileSync(trafficStatePath, trafficSeed.endsWith("\n") ? trafficSeed : `${trafficSeed}\n`, "utf8");

writeJson(researchBriefsPath, scenarioSeed.briefs);
writeJson(researchReportsPath, scenarioSeed.reports);

saveQueue({
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
  tasks: [],
});
saveAlertsState({
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
  thresholds: {
    queuedTasksHigh: 6,
    pendingReviewsHigh: 4,
    inactiveAgentsHigh: 2,
  },
  lastRunAt: null,
  lastResult: null,
  alerts: [],
});
saveSchedulerState({
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
  schedules: {},
});
saveCollaborationState({
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
  governance: scenarioSeed.governance,
  sharedSessions: [],
  handoffs: [],
  approvals: [],
  digestPreferences: {
    [demoAdmin.id]: { enabled: true, cadence: "daily", preferredChannel: "inbox" },
    [prodOperator.id]: { enabled: true, cadence: "daily", preferredChannel: "inbox" },
    [prodApprover.id]: { enabled: true, cadence: "daily", preferredChannel: "inbox" },
    [stagingOperator.id]: { enabled: true, cadence: "daily", preferredChannel: "inbox" },
    [labsOperator.id]: { enabled: true, cadence: "daily", preferredChannel: "inbox" },
  },
  digestRuns: {},
  digestWorkspaceState: {},
});
clearAuditEvents();
clearTelemetry();
clearJobs();

Object.entries(scenarioSeed.digestWorkspaceState).forEach(([workspaceId, state]) => {
  updateDigestWorkspaceState(workspaceId, state);
});
scenarioSeed.approvalRequests.forEach((request) => {
  createApprovalRequest({
    ...request,
    requestedById: demoAdmin.id,
    requestedByName: demoAdmin.name,
  });
});

console.log(`FlowWatch demo scenario reset: ${scenarioMeta.name}.`);
