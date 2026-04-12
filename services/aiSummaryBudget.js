const { loadDocument, saveDocument } = require("./stateDatabase");
const { getAgentsDataPath } = require("./runtimePaths");

const BUDGET_KEY = "ai.summary.budget";
const BUDGET_PATH = getAgentsDataPath("ai-summary-budget.json");

function currentBudgetDay() {
  return new Date().toISOString().slice(0, 10);
}

function defaultBudgetState() {
  return {
    day: currentBudgetDay(),
    usageUsd: 0,
    runs: 0,
    updatedAt: new Date().toISOString(),
    history: [],
  };
}

function loadBudgetState() {
  const state = loadDocument(BUDGET_KEY, defaultBudgetState, { legacyPath: BUDGET_PATH });
  const normalized = {
    ...defaultBudgetState(),
    ...state,
    history: Array.isArray(state.history) ? state.history.slice(-100) : [],
  };

  if (normalized.day !== currentBudgetDay()) {
    return defaultBudgetState();
  }

  return normalized;
}

function saveBudgetState(state) {
  return saveDocument(
    BUDGET_KEY,
    {
      day: state.day,
      usageUsd: Number(state.usageUsd || 0),
      runs: Number(state.runs || 0),
      updatedAt: state.updatedAt || new Date().toISOString(),
      history: Array.isArray(state.history) ? state.history.slice(-100) : [],
    },
    { legacyPath: BUDGET_PATH },
  );
}

function getAiSummaryBudgetSnapshot(input = {}) {
  const state = loadBudgetState();
  const dailyBudgetUsd = Number(input.dailyBudgetUsd || 0);
  const estimatedCostPerRunUsd = Number(input.estimatedCostPerRunUsd || 0);
  const projectedUsageUsd = Number((state.usageUsd + estimatedCostPerRunUsd).toFixed(4));

  return {
    day: state.day,
    usageUsd: Number(Number(state.usageUsd || 0).toFixed(4)),
    runs: Number(state.runs || 0),
    updatedAt: state.updatedAt || null,
    dailyBudgetUsd: Number(dailyBudgetUsd.toFixed ? dailyBudgetUsd.toFixed(4) : dailyBudgetUsd),
    estimatedCostPerRunUsd: Number(estimatedCostPerRunUsd.toFixed ? estimatedCostPerRunUsd.toFixed(4) : estimatedCostPerRunUsd),
    projectedUsageUsd: Number(projectedUsageUsd.toFixed(4)),
    remainingUsd: Number(Math.max(0, dailyBudgetUsd - Number(state.usageUsd || 0)).toFixed(4)),
    budgetExceeded: dailyBudgetUsd > 0 ? projectedUsageUsd > dailyBudgetUsd : false,
    recent: state.history.slice(-12).reverse(),
  };
}

function recordAiSummarySpend(input = {}) {
  const state = loadBudgetState();
  const costUsd = Number(Number(input.costUsd || 0).toFixed(4));
  state.usageUsd = Number((Number(state.usageUsd || 0) + costUsd).toFixed(4));
  state.runs = Number(state.runs || 0) + 1;
  state.updatedAt = new Date().toISOString();
  state.history.push({
    id: `budget_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: state.updatedAt,
    traceId: input.traceId || null,
    provider: input.provider || null,
    costUsd,
    attempts: Number(input.attempts || 0),
  });
  saveBudgetState(state);
  return getAiSummaryBudgetSnapshot({
    dailyBudgetUsd: Number(input.dailyBudgetUsd || 0),
    estimatedCostPerRunUsd: Number(input.estimatedCostPerRunUsd || 0),
  });
}

function clearAiSummaryBudgetForTests() {
  saveBudgetState(defaultBudgetState());
}

module.exports = {
  getAiSummaryBudgetSnapshot,
  recordAiSummarySpend,
  clearAiSummaryBudgetForTests,
};
