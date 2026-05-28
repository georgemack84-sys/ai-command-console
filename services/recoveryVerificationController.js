"use strict";

const { runRecoveryVerification } = require("./recoveryVerificationRunner");
const verificationStore = require("./recoveryVerificationStore");

function runVerificationOnce({ db = null, modes = {}, requestedBy = "system", limit = 25, dryRun = false } = {}) {
  return runRecoveryVerification({
    db,
    modes,
    requestedBy,
    limit,
    dryRun,
  });
}

function getRecoveryVerificationStatus({ executionId = null, recoveryRequestId = null } = {}) {
  void executionId;
  return {
    ok: true,
    data: recoveryRequestId ? verificationStore.deriveVerificationState({ recoveryRequestId }) : null,
  };
}

function requestVerification(payload = {}) {
  verificationStore.recordVerificationStarted(payload);
  return {
    ok: true,
    data: {
      queued: true,
      executionId: payload.executionId,
      recoveryRequestId: payload.recoveryRequestId,
    },
  };
}

module.exports = {
  getRecoveryVerificationStatus,
  requestVerification,
  runVerificationOnce,
};
