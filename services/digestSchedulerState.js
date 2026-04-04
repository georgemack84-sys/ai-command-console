const schedulerState = {
  enabled: false,
  intervalMs: 60_000,
  lastRunAt: null,
  lastResult: null,
  lastError: null,
};

function updateDigestSchedulerStatus(updates = {}) {
  Object.assign(schedulerState, updates);
  return getDigestSchedulerStatus();
}

function getDigestSchedulerStatus() {
  return {
    enabled: Boolean(schedulerState.enabled),
    intervalMs: Math.max(10_000, Number(schedulerState.intervalMs || 60_000)),
    lastRunAt: schedulerState.lastRunAt || null,
    lastResult: schedulerState.lastResult || null,
    lastError: schedulerState.lastError || null,
  };
}

module.exports = {
  updateDigestSchedulerStatus,
  getDigestSchedulerStatus,
};
