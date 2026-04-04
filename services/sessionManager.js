const path = require("path");
const { loadJsonDocument, saveJsonDocument } = require("./documentStore");

const missionsFile = path.join(__dirname, "..", "memory", "missions.json");
const currentMissionFile = path.join(__dirname, "..", "memory", "currentMission.json");
const MISSIONS_KEY = "runtime.missions";
const CURRENT_MISSION_KEY = "runtime.current-mission";

function loadJson(filePath, defaultData) {
  try {
    const key = filePath === missionsFile ? MISSIONS_KEY : CURRENT_MISSION_KEY;
    return loadJsonDocument(key, filePath, defaultData, (value) =>
      value && typeof value === "object" ? value : defaultData
    );
  } catch (err) {
    console.error(`Failed to read ${filePath}:`, err.message);
    return defaultData;
  }
}

function saveJson(filePath, data) {
  const key = filePath === missionsFile ? MISSIONS_KEY : CURRENT_MISSION_KEY;
  saveJsonDocument(key, filePath, data, (value) => (value && typeof value === "object" ? value : {}));
}

function generateMissionId() {
  return `mission_${Date.now()}`;
}

function getAllMissions() {
  const data = loadJson(missionsFile, { missions: [] });
  return data.missions || [];
}

function saveAllMissions(missions) {
  saveJson(missionsFile, { missions });
}

function getCurrentMissionId() {
  const data = loadJson(currentMissionFile, { activeMissionId: null });
  return data.activeMissionId || null;
}

function setCurrentMissionId(id) {
  saveJson(currentMissionFile, { activeMissionId: id });
}

function getActiveMission() {
  const missionId = getCurrentMissionId();
  if (!missionId) return null;

  const missions = getAllMissions();
  return missions.find((m) => m.id === missionId) || null;
}

function createMission(title) {
  const missions = getAllMissions();

  const mission = {
    id: generateMissionId(),
    title,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    steps: [],
    notes: [],
    history: [
      {
        type: "created",
        message: `Mission created: ${title}`,
        timestamp: new Date().toISOString()
      }
    ]
  };

  missions.push(mission);
  saveAllMissions(missions);
  setCurrentMissionId(mission.id);

  return mission;
}

function updateMission(updatedMission) {
  const missions = getAllMissions();
  const index = missions.findIndex((m) => m.id === updatedMission.id);

  if (index === -1) {
    throw new Error("Mission not found.");
  }

  updatedMission.updatedAt = new Date().toISOString();
  missions[index] = updatedMission;
  saveAllMissions(missions);
  return updatedMission;
}

function addStep(stepText) {
  const mission = getActiveMission();
  if (!mission) throw new Error("No active mission.");

  mission.steps.push({
    id: mission.steps.length + 1,
    text: stepText,
    status: "pending",
    createdAt: new Date().toISOString(),
    completedAt: null
  });

  mission.history.push({
    type: "step_added",
    message: `Added step: ${stepText}`,
    timestamp: new Date().toISOString()
  });

  return updateMission(mission);
}

function completeStep(stepId) {
  const mission = getActiveMission();
  if (!mission) throw new Error("No active mission.");

  const step = mission.steps.find((s) => s.id === Number(stepId));
  if (!step) throw new Error(`Step ${stepId} not found.`);

  step.status = "completed";
  step.completedAt = new Date().toISOString();

  mission.history.push({
    type: "step_completed",
    message: `Completed step ${stepId}: ${step.text}`,
    timestamp: new Date().toISOString()
  });

  return updateMission(mission);
}

function addNote(noteText) {
  const mission = getActiveMission();
  if (!mission) throw new Error("No active mission.");

  mission.notes.push({
    id: mission.notes.length + 1,
    text: noteText,
    timestamp: new Date().toISOString()
  });

  mission.history.push({
    type: "note_added",
    message: `Added note: ${noteText}`,
    timestamp: new Date().toISOString()
  });

  return updateMission(mission);
}

function closeMission() {
  const mission = getActiveMission();
  if (!mission) throw new Error("No active mission.");

  mission.status = "closed";
  mission.completedAt = new Date().toISOString();
  mission.history.push({
    type: "closed",
    message: `Mission closed: ${mission.title}`,
    timestamp: new Date().toISOString()
  });

  updateMission(mission);
  setCurrentMissionId(null);
  return mission;
}

function resumeMission() {
  const mission = getActiveMission();
  if (!mission) throw new Error("No active mission to resume.");
  return mission;
}

function listMissions() {
  return getAllMissions().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

module.exports = {
  createMission,
  getActiveMission,
  addStep,
  completeStep,
  addNote,
  closeMission,
  resumeMission,
  listMissions
};
