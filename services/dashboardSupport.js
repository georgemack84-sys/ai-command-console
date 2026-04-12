function safeCount(fn, fallback = 0) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function safeValue(fn, fallback = null) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function formatEventTitle(type) {
  return String(type || "activity")
    .replaceAll(":", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function buildWorkspaceInventorySnapshot({ users, routes, briefs, reports }) {
  const map = new Map();

  (Array.isArray(users) ? users : []).forEach((user) => {
    if (!user || user.status === "disabled") {
      return;
    }
    const workspaceId = String(user.workspaceId || "default");
    const current = map.get(workspaceId) || {
      workspaceId,
      name: user.workspaceName || "Main Workspace",
      members: 0,
      briefs: 0,
      reports: 0,
      routes: 0,
      updatedAt: user.createdAt || null,
    };
    current.members += 1;
    current.name = user.workspaceName || current.name;
    current.updatedAt = current.updatedAt || user.createdAt || null;
    map.set(workspaceId, current);
  });

  for (const [workspaceId, workspace] of map.entries()) {
    const routeCount = Array.isArray(routes?.[workspaceId]) ? routes[workspaceId].length : 0;
    const briefItems = Array.isArray(briefs?.[workspaceId]) ? briefs[workspaceId] : [];
    const reportItems = Array.isArray(reports?.[workspaceId]) ? reports[workspaceId] : [];
    const latestTimestamps = [
      workspace.updatedAt,
      ...briefItems.map((item) => item?.updatedAt || item?.createdAt || null),
      ...reportItems.map((item) => item?.updatedAt || item?.createdAt || null),
    ].filter(Boolean);

    workspace.routes = routeCount;
    workspace.briefs = briefItems.length;
    workspace.reports = reportItems.length;
    workspace.updatedAt = latestTimestamps.sort().slice(-1)[0] || null;
  }

  return [...map.values()].sort((left, right) => {
    const leftScore = left.members + left.briefs + left.reports + left.routes;
    const rightScore = right.members + right.briefs + right.reports + right.routes;
    return rightScore - leftScore;
  });
}

module.exports = {
  safeCount,
  safeValue,
  formatEventTitle,
  buildWorkspaceInventorySnapshot,
};
