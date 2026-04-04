const fs = require("fs");
const path = require("path");

const AGENTS_DIR = path.join(process.cwd(), "agents");

function getProfilePath(agentName) {
  return path.join(AGENTS_DIR, `${agentName}.json`);
}

function readAgentProfile(agentName) {
  const profilePath = getProfilePath(agentName);

  if (!fs.existsSync(profilePath)) {
    throw new Error(`Agent profile not found: ${agentName}`);
  }

  return JSON.parse(fs.readFileSync(profilePath, "utf8"));
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

  fs.writeFileSync(profilePath, JSON.stringify(next, null, 2), "utf8");
  return next;
}

module.exports = {
  getProfilePath,
  readAgentProfile,
  updateAgentProfile,
};
