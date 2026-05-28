"use strict";

const { runRecoveryLearningPass } = require("./recoveryLearningRunner");
const learningStore = require("./recoveryLearningStore");

function runLearningOnce({ db = null, modes = {}, requestedBy = "system", limit = 25, dryRun = false } = {}) {
  return runRecoveryLearningPass({
    db,
    modes,
    requestedBy,
    limit,
    dryRun,
  });
}

function getLatestLearningReport({ executionId = null } = {}) {
  return {
    ok: true,
    data: learningStore.getLatestLearningReport({ executionId }),
  };
}

function listLearningReports({ limit = 20 } = {}) {
  return {
    ok: true,
    data: learningStore.listLearningReports({ limit }),
  };
}

module.exports = {
  getLatestLearningReport,
  listLearningReports,
  runLearningOnce,
};
