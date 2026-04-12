const fs = require("fs");
const path = require("path");
const { getAgentsDataPath } = require("./runtimePaths");

const SEED_AGENTS_DIR = path.join(process.cwd(), "agents");

function getRuntimeProfilesDir() {
  return getAgentsDataPath("profiles");
}

function getProfilePath(agentName) {
  return path.join(getRuntimeProfilesDir(), `${agentName}.json`);
}

function getSeedProfilePath(agentName) {
  return path.join(SEED_AGENTS_DIR, `${agentName}.json`);
}

function readAgentProfile(agentName) {
  const profilePath = getProfilePath(agentName);
  const seedProfilePath = getSeedProfilePath(agentName);
  const readablePath = fs.existsSync(profilePath) ? profilePath : seedProfilePath;

  if (!fs.existsSync(readablePath)) {
    throw new Error(`Agent profile not found: ${agentName}`);
  }

  return JSON.parse(fs.readFileSync(readablePath, "utf8"));
}

function updateAgentProfile(agentName, updates = {}) {
  const profilePath = getProfilePath(agentName);
  const current = readAgentProfile(agentName);

  const next = {
    ...current,
    ...(typeof updates.description === "string" ? { description: updates.description.trim() } : {}),
    ...(typeof updates.role === "string" ? { role: updates.role.trim() } : {}),
    ...(typeof updates.defaultGoal === "string" ? { defaultGoal: updates.defaultGoal.trim() } : {}),
    ...(typeof updates.systemPrompt === "string" ? { systemPrompt: updates.systemPrompt.trim() } : {}),
    ...(Number.isFinite(Number(updates.maxStepsPerRun)) ? { maxStepsPerRun: Number(updates.maxStepsPerRun) } : {}),
    ...(Number.isFinite(Number(updates.cooldownSeconds)) ? { cooldownSeconds: Number(updates.cooldownSeconds) } : {}),
    ...(typeof updates.allowShellExecution === "boolean" ? { allowShellExecution: updates.allowShellExecution } : {}),
    ...(typeof updates.allowFileWrite === "boolean" ? { allowFileWrite: updates.allowFileWrite } : {}),
    ...(typeof updates.allowPlanning === "boolean" ? { allowPlanning: updates.allowPlanning } : {}),
    ...(Array.isArray(updates.tags)
      ? { tags: updates.tags.map((item) => String(item).trim()).filter(Boolean) }
      : {}),
  };

  fs.mkdirSync(path.dirname(profilePath), { recursive: true });
  fs.writeFileSync(profilePath, JSON.stringify(next, null, 2), "utf8");
  return next;
}

module.exports = {
  getProfilePath,
  readAgentProfile,
  updateAgentProfile,
};
