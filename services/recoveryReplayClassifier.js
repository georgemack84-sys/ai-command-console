"use strict";

const REPLAY_CLASSIFICATIONS = Object.freeze({
  SAFE_REPLAY: "SAFE_REPLAY",
  IDEMPOTENT_REPLAY: "IDEMPOTENT_REPLAY",
  REQUIRES_OPERATOR: "REQUIRES_OPERATOR",
  UNSAFE_REPLAY: "UNSAFE_REPLAY",
  CORRUPTED: "CORRUPTED",
});

function failure(code, message, details = {}) {
  return {
    ok: false,
    code: String(code || "INVALID_RECOVERY_CLASSIFICATION"),
    message: String(message || "Replay candidate classification failed."),
    ...details,
  };
}

function success(data) {
  return {
    ok: true,
    data,
  };
}

function normalizeString(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeSideEffects(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((entry) => normalizeString(entry)).filter(Boolean);
}

function hasIdempotencyEvidence(stepRow) {
  return Boolean(
    stepRow?.isIdempotent
    || normalizeString(stepRow?.idempotencyClass) === "safe_repeat"
    || String(stepRow?.idempotencyKey || "").trim()
  );
}

function getAttemptTerminalLedgerState(ledgerEvents) {
  const scoped = ledgerEvents
    .filter((event) => normalizeString(event?.eventType).startsWith("attempt."))
    .sort((left, right) =>
      Number(right?.attemptNumber || 0) - Number(left?.attemptNumber || 0)
      || Number(right?.createdAt || 0) - Number(left?.createdAt || 0)
      || Number(right?.id || 0) - Number(left?.id || 0)
    );

  if (!scoped.length) {
    return {
      started: false,
      terminals: [],
      latestTerminal: null,
    };
  }

  const resolvedAttemptNumber = Number(scoped[0]?.attemptNumber || 0);
  const attemptLedger = scoped.filter((event) => Number(event?.attemptNumber || 0) === resolvedAttemptNumber);
  const terminals = attemptLedger
    .map((event) => normalizeString(event?.eventType))
    .filter((eventType) => ["attempt.completed", "attempt.failed", "attempt.cancelled", "attempt.abandoned"].includes(eventType));

  return {
    started: attemptLedger.some((event) => normalizeString(event?.eventType) === "attempt.started"),
    terminals,
    latestTerminal: terminals.length ? terminals[terminals.length - 1] : null,
  };
}

function detectCorruption(stepRow, attemptLedgerState) {
  const stepStatus = normalizeString(stepRow?.status);
  const latestTerminal = normalizeString(attemptLedgerState?.latestTerminal);
  const terminals = Array.isArray(attemptLedgerState?.terminals) ? attemptLedgerState.terminals : [];

  if (new Set(terminals).size > 1) {
    return "Multiple terminal attempt ledger events exist for the same replay candidate.";
  }

  if (stepStatus === "completed" && latestTerminal && latestTerminal !== "attempt.completed") {
    return "Persisted completed step state conflicts with terminal attempt ledger evidence.";
  }

  if (stepStatus === "failed" && latestTerminal === "attempt.completed") {
    return "Persisted failed step state conflicts with completed attempt ledger evidence.";
  }

  if (stepStatus === "cancelled" && latestTerminal && latestTerminal !== "attempt.cancelled") {
    return "Persisted cancelled step state conflicts with terminal attempt ledger evidence.";
  }

  if (
    stepStatus === "completed"
    && !latestTerminal
    && (stepRow?.finishedAt || stepRow?.lastOutputHash)
  ) {
    return "Persisted completed step evidence exists without matching terminal attempt ledger evidence.";
  }

  return null;
}

/**
 * @param {{ stepRow: object, ledgerEvents: Array<object> }} input
 * @returns {{ ok: false, code: string, message: string } | { ok: true, data: object }}
 */
function classifyReplayCandidate(input) {
  if (!input || typeof input !== "object") {
    return failure("INVALID_RECOVERY_CLASSIFIER_INPUT", "Replay classifier input is required.");
  }

  const { stepRow, ledgerEvents } = input;
  if (!stepRow || typeof stepRow !== "object") {
    return failure("INVALID_RECOVERY_CLASSIFIER_INPUT", "stepRow is required for replay classification.");
  }
  if (!Array.isArray(ledgerEvents)) {
    return failure("INVALID_RECOVERY_CLASSIFIER_INPUT", "ledgerEvents must be an array for replay classification.");
  }

  const sideEffects = normalizeSideEffects(stepRow.sideEffects);
  const idempotencyEvidence = hasIdempotencyEvidence(stepRow);
  const attemptLedgerState = getAttemptTerminalLedgerState(ledgerEvents);
  const corruptionReason = detectCorruption(stepRow, attemptLedgerState);

  if (corruptionReason) {
    return success({
      classification: REPLAY_CLASSIFICATIONS.CORRUPTED,
      reason: corruptionReason,
      sideEffects,
      idempotencyEvidence,
      attemptLedgerState,
      classifications: REPLAY_CLASSIFICATIONS,
    });
  }

  const hasUnknownSideEffects = sideEffects.includes("unknown");
  if (sideEffects.length > 0 && !idempotencyEvidence && !hasUnknownSideEffects) {
    return success({
      classification: REPLAY_CLASSIFICATIONS.UNSAFE_REPLAY,
      reason: "Replay candidate has declared side effects without idempotency evidence.",
      sideEffects,
      idempotencyEvidence,
      attemptLedgerState,
      classifications: REPLAY_CLASSIFICATIONS,
    });
  }

  if (
    hasUnknownSideEffects
    || (attemptLedgerState.started && !attemptLedgerState.latestTerminal)
  ) {
    return success({
      classification: REPLAY_CLASSIFICATIONS.REQUIRES_OPERATOR,
      reason: hasUnknownSideEffects
        ? "Replay candidate includes unknown side effects."
        : "Replay candidate has ambiguous attempt evidence without a terminal outcome.",
      sideEffects,
      idempotencyEvidence,
      attemptLedgerState,
      classifications: REPLAY_CLASSIFICATIONS,
    });
  }

  if (sideEffects.length > 0 && idempotencyEvidence) {
    return success({
      classification: REPLAY_CLASSIFICATIONS.IDEMPOTENT_REPLAY,
      reason: "Replay candidate has side effects but also has idempotency evidence.",
      sideEffects,
      idempotencyEvidence,
      attemptLedgerState,
      classifications: REPLAY_CLASSIFICATIONS,
    });
  }

  if (sideEffects.length === 0) {
    return success({
      classification: REPLAY_CLASSIFICATIONS.SAFE_REPLAY,
      reason: "Replay candidate has no declared side effects.",
      sideEffects,
      idempotencyEvidence,
      attemptLedgerState,
      classifications: REPLAY_CLASSIFICATIONS,
    });
  }

  return success({
    classification: REPLAY_CLASSIFICATIONS.REQUIRES_OPERATOR,
    reason: "Replay candidate could not be classified safely.",
    sideEffects,
    idempotencyEvidence,
    attemptLedgerState,
    classifications: REPLAY_CLASSIFICATIONS,
  });
}

module.exports = {
  REPLAY_CLASSIFICATIONS,
  classifyReplayCandidate,
};
