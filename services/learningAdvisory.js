const { appendAuditEvent } = require("./auditTrail");
const { loadDocument, saveDocument, runInTransaction, withDatabase } = require("./stateDatabase");
const { getAgentsDataPath } = require("./runtimePaths");

const LEARNING_STATE_KEY = "execution-learning-state";
const LEARNING_STATE_PATH = getAgentsDataPath("execution-learning-state.json");
const POSITIVE_OUTCOMES = new Set(["executed", "confirmed", "accepted", "approved", "simulated"]);
const NEGATIVE_OUTCOMES = new Set(["blocked", "failed", "dismissed", "rejected", "timeout"]);
const DEFAULT_MINIMUM_EVIDENCE_COUNT = 3;
const DEFAULT_MAX_PATTERNS_CREATED_PER_HOUR = 10;
const DEFAULT_OSCILLATION_THRESHOLD = 3;
const DEFAULT_LOOKBACK_LIMIT = 50;
const DEFAULT_LOOKBACK_DAYS = 7;

function nowIso() {
  return new Date().toISOString();
}

function defaultLearningState() {
  return {
    createdAt: nowIso(),
    updatedAt: nowIso(),
    mode: "observation_only",
    events: [],
    rollback: {
      lastChangedAt: null,
      lastChangedBy: null,
      lastReason: null,
      resetAt: null,
    },
  };
}

function loadLearningState() {
  return loadDocument(LEARNING_STATE_KEY, defaultLearningState, {
    legacyPath: LEARNING_STATE_PATH,
  });
}

function saveLearningState(value) {
  return saveDocument(LEARNING_STATE_KEY, value, {
    legacyPath: LEARNING_STATE_PATH,
  });
}

function buildGovernanceConfig(policy = {}) {
  const strictMode = policy?.strictMode || {};
  return {
    minimumEvidenceCount: DEFAULT_MINIMUM_EVIDENCE_COUNT,
    maxPatternsCreatedPerHour: DEFAULT_MAX_PATTERNS_CREATED_PER_HOUR,
    oscillationThreshold: DEFAULT_OSCILLATION_THRESHOLD,
    lookbackLimit: Math.max(1, Number(strictMode.reviewIntelligenceLookbackLimit ?? DEFAULT_LOOKBACK_LIMIT) || DEFAULT_LOOKBACK_LIMIT),
    lookbackDays: Math.max(1, Number(strictMode.reviewIntelligenceLookbackDays ?? DEFAULT_LOOKBACK_DAYS) || DEFAULT_LOOKBACK_DAYS),
  };
}

function appendLearningAudit(eventType, payload = {}, actor = "system", message = "") {
  return appendAuditEvent({
    type: "learning",
    eventType,
    actor,
    message: message || eventType,
    payload,
  });
}

function recordLearningEvent(event = {}) {
  const state = loadLearningState();
  const normalized = {
    id: String(event.id || `learning_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
    timestamp: nowIso(),
    sessionId: event.sessionId ? String(event.sessionId) : null,
    actorId: event.actorId ? String(event.actorId) : null,
    actorRole: event.actorRole ? String(event.actorRole) : null,
    eventType: String(event.eventType || "review_observation"),
    requestKey: String(event.requestKey || ""),
    recommendationId: event.recommendationId ? String(event.recommendationId) : null,
    reviewMode: event.reviewMode ? String(event.reviewMode) : "minimal",
    riskLevel: event.riskLevel ? String(event.riskLevel) : "low",
    deltaPresent: Boolean(event.deltaPresent),
    attentionSignals: Array.isArray(event.attentionSignals) ? event.attentionSignals.map((value) => String(value)) : [],
    outcome: String(event.outcome || "observed"),
    evidenceComplete: Boolean(event.evidenceComplete),
    reasonCode: String(event.reasonCode || ""),
    recommendationConfidence: Number(event.recommendationConfidence ?? 0),
    recommendationPriority: String(event.recommendationPriority || "low"),
  };
  const next = {
    ...state,
    updatedAt: nowIso(),
    events: [normalized, ...(state.events || [])].slice(0, 200),
  };
  saveLearningState(next);
  appendLearningAudit(
    normalized.eventType === "operator_feedback" ? "learning.feedback_recorded" : "learning.outcome_recorded",
    {
      eventId: normalized.id,
      outcome: normalized.outcome,
      requestKey: normalized.requestKey,
      reasonCode: normalized.reasonCode,
    },
    normalized.actorId ? "operator" : "system",
    `Recorded learning event ${normalized.id}.`
  );
  return normalized;
}

function setLearningMode(mode = "observation_only", actor = {}, reason = "") {
  const allowedModes = new Set(["observation_only", "advisory_applied", "disabled"]);
  const normalizedMode = allowedModes.has(String(mode)) ? String(mode) : "observation_only";
  const state = loadLearningState();
  const next = {
    ...state,
    updatedAt: nowIso(),
    mode: normalizedMode,
    rollback: {
      ...(state.rollback || {}),
      lastChangedAt: nowIso(),
      lastChangedBy: String(actor.id || actor.name || "system"),
      lastReason: String(reason || "mode_update"),
    },
  };
  saveLearningState(next);
  return next;
}

function resetLearningState(actor = {}, reason = "") {
  const state = loadLearningState();
  const next = {
    ...defaultLearningState(),
    mode: "observation_only",
    rollback: {
      ...(state.rollback || {}),
      lastChangedAt: nowIso(),
      lastChangedBy: String(actor.id || actor.name || "system"),
      lastReason: String(reason || "reset_learning_state"),
      resetAt: nowIso(),
    },
  };
  saveLearningState(next);
  return next;
}

function listRecentLearningEvents(policy = {}) {
  const state = loadLearningState();
  const config = buildGovernanceConfig(policy);
  return (state.events || [])
    .filter((event) => Number.isFinite(Date.parse(String(event.timestamp || ""))))
    .slice(0, config.lookbackLimit);
}

function calculateLearningActivation(events = [], state = loadLearningState()) {
  const sessions = new Set(events.map((event) => String(event.sessionId || "")).filter(Boolean));
  const sufficient = events.length >= 10 && sessions.size >= 2;
  return {
    sufficient,
    eventCount: events.length,
    sessionCount: sessions.size,
    mode: sufficient ? state.mode : "observation_only",
  };
}

function detectLearningConflicts(events = []) {
  const positive = events.filter((event) => POSITIVE_OUTCOMES.has(String(event.outcome || ""))).length;
  const negative = events.filter((event) => NEGATIVE_OUTCOMES.has(String(event.outcome || ""))).length;
  return {
    conflict: positive > 0 && negative > 0,
    positive,
    negative,
  };
}

function detectLearningStaleness(events = []) {
  if (!events.length) {
    return {
      stale: true,
      reason: "No recent learning events are available.",
    };
  }
  const latest = Math.max(...events.map((event) => Date.parse(String(event.timestamp || 0))).filter(Number.isFinite));
  const stale = Date.now() - latest > Math.floor((DEFAULT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000) / 2);
  return {
    stale,
    reason: stale ? "Recent learning evidence is getting stale." : null,
  };
}

function normalizeEvidenceBackedItem(item = {}, fallback = {}) {
  const complete = Boolean(item.sourceType && item.sourceField && item.reasonCode);
  const baseConfidence = Number.isFinite(Number(item.confidenceScore))
    ? Number(item.confidenceScore)
    : Number.isFinite(Number(fallback.confidenceScore))
      ? Number(fallback.confidenceScore)
      : 0.4;
  return {
    ...fallback,
    ...item,
    sourceType: item.sourceType || fallback.sourceType || "learning_events",
    sourceField: item.sourceField || fallback.sourceField || "events",
    reasonCode: item.reasonCode || fallback.reasonCode || "EVIDENCE_INCOMPLETE",
    advisoryState: complete ? "advisory_complete" : "advisory_incomplete",
    confidenceScore: complete ? Math.max(0, Math.min(1, baseConfidence)) : Math.min(0.4, Math.max(0, Math.min(1, baseConfidence))),
  };
}

function buildSignalQualityIndicators(events = [], recommendation, attentionPoints = []) {
  const reasonCounts = new Map();
  for (const event of events) {
    const key = String(event.reasonCode || "UNKNOWN");
    reasonCounts.set(key, Number(reasonCounts.get(key) || 0) + 1);
  }

  const fatigueSignals = [...reasonCounts.entries()]
    .filter(([, count]) => count >= 10)
    .map(([reasonCode, count]) =>
      normalizeEvidenceBackedItem({
        id: `fatigue_${reasonCode}`,
        title: `Repeated signal ${reasonCode} may be losing value.`,
        detail: `${reasonCode} appeared ${count} times in the bounded learning window.`,
        priority: "low",
        sourceType: "learning_events",
        sourceField: "reasonCode",
        reasonCode: "SIGNAL_FATIGUE",
        confidenceScore: 0.45,
        historicalBasis: { reasonCode, count },
      })
    );

  const highValueSignals = [recommendation, ...(attentionPoints || [])]
    .filter(Boolean)
    .filter((item) => item.priority === "high" && item.reasonCode !== "EVIDENCE_INCOMPLETE")
    .slice(0, 3);

  const lowValueSignals = fatigueSignals.slice(0, 3);
  const stale = detectLearningStaleness(events);
  return {
    highValueSignals,
    lowValueSignals,
    fatigueDetected: lowValueSignals.length > 0,
    ...(stale.stale
      ? {
          markers: ["learning_stale"],
          staleReason: stale.reason,
        }
      : {}),
  };
}

function buildOperatorPreferenceInsights(events = []) {
  const positive = events.filter((event) => POSITIVE_OUTCOMES.has(String(event.outcome || "")));
  if (!positive.length) {
    return {
      status: "degraded",
      summary: "Operator preference insights remain observational because positive outcome evidence is limited.",
      sourceType: "learning_events",
      sourceField: "outcome",
      reasonCode: "GAP_MISSING_EVIDENCE",
      confidenceScore: 0.35,
      displayPreference: "balanced",
      orderingPreference: "risk_first",
      // TRUST_MODEL_PLACEHOLDER
      trustWeight: 1.0,
    };
  }

  const averageAttention = positive.reduce((sum, event) => sum + Number((event.attentionSignals || []).length || 0), 0) / positive.length;
  const displayPreference = averageAttention <= 1 ? "compressed" : averageAttention >= 3 ? "expanded" : "balanced";
  return {
    status: "available",
    summary: `Recent positive outcomes correlate with a ${displayPreference} review presentation style.`,
    sourceType: "learning_events",
    sourceField: "attentionSignals",
    reasonCode: "PRESENTATION_CORRELATION",
    confidenceScore: 0.6,
    displayPreference,
    orderingPreference: "risk_first",
    // TRUST_MODEL_PLACEHOLDER
    trustWeight: 1.0,
  };
}

function buildLearningConfidence(events = [], activation = null, markers = []) {
  const activationState = activation || calculateLearningActivation(events);
  if (!activationState.sufficient) {
    return {
      score: 0.25,
      label: "low",
      markers: [...new Set(["learning_insufficient_data", ...markers])],
    };
  }
  const stale = detectLearningStaleness(events);
  if (stale.stale) {
    return {
      score: 0.4,
      label: "low",
      markers: [...new Set(["learning_stale", ...markers])],
    };
  }
  return {
    score: 0.65,
    label: "medium",
    markers: [...new Set(markers)],
  };
}

function computeEffectiveConfidence(confidence = 0, decayRate = 0, lastSeenAt = null, now = Date.now()) {
  const rawConfidence = Math.max(0, Math.min(1, Number(confidence) || 0));
  const rate = Math.max(0, Number(decayRate) || 0);
  const timestamp = Date.parse(String(lastSeenAt || ""));
  if (!Number.isFinite(timestamp)) {
    return rawConfidence;
  }
  const daysSinceLastSeen = Math.max(0, (Number(now) - timestamp) / (24 * 60 * 60 * 1000));
  return rawConfidence * Math.exp(-rate * daysSinceLastSeen);
}

function withLearningDatabase(work) {
  return withDatabase((db) => work(db));
}

function normalizePatternRow(row = {}) {
  return {
    id: String(row.id),
    signature: String(row.signature),
    scope: String(row.scope),
    mode: String(row.mode),
    validationStatus: String(row.validation_status || row.validationStatus),
    confidence: Number(row.confidence || 0),
    decayRate: Number(row.decay_rate || row.decayRate || 0),
    evidenceCount: Number(row.evidence_count || row.evidenceCount || 0),
    contradictionCount: Number(row.contradiction_count || row.contradictionCount || 0),
    hintPayload: typeof row.hint_payload === "string" ? JSON.parse(row.hint_payload || "null") : row.hintPayload,
    shadowPayload: typeof row.shadow_payload === "string" ? JSON.parse(row.shadow_payload || "null") : row.shadowPayload,
    lastSeenAt: String(row.last_seen_at || row.lastSeenAt),
    createdAt: String(row.created_at || row.createdAt),
    updatedAt: String(row.updated_at || row.updatedAt),
  };
}

function listLearningPatterns(filter = {}) {
  return withLearningDatabase((db) => {
    const where = [];
    const params = [];
    if (filter.mode) {
      where.push("mode = ?");
      params.push(String(filter.mode));
    }
    if (filter.validationStatus) {
      where.push("validation_status = ?");
      params.push(String(filter.validationStatus));
    }
    const query = `
      SELECT *
      FROM learning_patterns
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY updated_at DESC, created_at DESC
    `;
    return db.prepare(query).all(...params).map(normalizePatternRow);
  });
}

function countRecentPatternCreations(db) {
  const threshold = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const row = db.prepare(`
    SELECT COUNT(*) AS count
    FROM learning_patterns
    WHERE created_at >= ?
  `).get(threshold);
  return Number(row?.count || 0);
}

function toPatternSignature(event = {}) {
  const reasonCode = String(event.reasonCode || "UNKNOWN");
  const reviewMode = String(event.reviewMode || "minimal");
  return {
    signature: `${reasonCode}::${reviewMode}`,
    scope: reasonCode,
  };
}

function classifyPatternValidation(positiveCount, negativeCount, config) {
  if (positiveCount > 0 && negativeCount > 0) {
    return {
      validationStatus: "conflicting",
      contradictionCount: positiveCount + negativeCount,
    };
  }
  return {
    validationStatus:
      positiveCount + negativeCount >= config.minimumEvidenceCount ? "validated" : "pending",
    contradictionCount: 0,
  };
}

function upsertDetectedPatterns(policy = {}) {
  const config = buildGovernanceConfig(policy);
  const events = listRecentLearningEvents(policy);
  return runInTransaction((db) => {
    const grouped = new Map();
    for (const event of events) {
      const key = toPatternSignature(event);
      const existing = grouped.get(key.signature) || {
        signature: key.signature,
        scope: key.scope,
        reviewMode: String(event.reviewMode || "minimal"),
        evidenceCount: 0,
        positiveCount: 0,
        negativeCount: 0,
        lastSeenAt: String(event.timestamp || nowIso()),
      };
      existing.evidenceCount += 1;
      if (POSITIVE_OUTCOMES.has(String(event.outcome || ""))) {
        existing.positiveCount += 1;
      }
      if (NEGATIVE_OUTCOMES.has(String(event.outcome || ""))) {
        existing.negativeCount += 1;
      }
      if (Date.parse(String(event.timestamp || 0)) > Date.parse(existing.lastSeenAt)) {
        existing.lastSeenAt = String(event.timestamp);
      }
      grouped.set(key.signature, existing);
    }

    let createdThisRun = 0;
    const createdInWindow = countRecentPatternCreations(db);
    const patterns = [];

    for (const candidate of grouped.values()) {
      const existing = db.prepare(`
        SELECT *
        FROM learning_patterns
        WHERE signature = ?
      `).get(candidate.signature);

      if (!existing && createdInWindow + createdThisRun >= config.maxPatternsCreatedPerHour) {
        continue;
      }

      const validation = classifyPatternValidation(candidate.positiveCount, candidate.negativeCount, config);
      let confidence = Math.min(1, candidate.evidenceCount / Math.max(config.minimumEvidenceCount, 1));
      if (validation.validationStatus === "conflicting") {
        confidence *= 0.5;
      }
      const hintPayload = {
        title: `Pattern for ${candidate.scope}`,
        detail: `${candidate.evidenceCount} bounded observations across ${candidate.reviewMode} review mode.`,
        reasonCode: candidate.scope,
        reviewMode: candidate.reviewMode,
      };
      const shadowPayload = {
        title: `Shadow pattern for ${candidate.scope}`,
        detail: `Mode remains shadow until promoted through governance.`,
        reasonCode: candidate.scope,
      };

      if (existing) {
        db.prepare(`
          UPDATE learning_patterns
          SET scope = ?,
              confidence = ?,
              decay_rate = ?,
              validation_status = ?,
              evidence_count = ?,
              contradiction_count = ?,
              hint_payload = ?,
              shadow_payload = ?,
              last_seen_at = ?,
              updated_at = ?
          WHERE signature = ?
        `).run(
          candidate.scope,
          confidence,
          0.1,
          validation.validationStatus,
          candidate.evidenceCount,
          validation.contradictionCount,
          JSON.stringify(hintPayload),
          JSON.stringify(shadowPayload),
          candidate.lastSeenAt,
          nowIso(),
          candidate.signature
        );
      } else {
        const id = `pattern_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        db.prepare(`
          INSERT INTO learning_patterns (
            id, signature, scope, mode, validation_status, confidence, decay_rate,
            evidence_count, contradiction_count, hint_payload, shadow_payload,
            last_seen_at, created_at, updated_at
          )
          VALUES (?, ?, ?, 'shadow', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          id,
          candidate.signature,
          candidate.scope,
          validation.validationStatus,
          confidence,
          0.1,
          candidate.evidenceCount,
          validation.contradictionCount,
          JSON.stringify(hintPayload),
          JSON.stringify(shadowPayload),
          candidate.lastSeenAt,
          nowIso(),
          nowIso()
        );
        createdThisRun += 1;
      }

      appendLearningAudit(
        "learning.pattern_detected",
        {
          signature: candidate.signature,
          scope: candidate.scope,
          evidenceCount: candidate.evidenceCount,
          validationStatus: validation.validationStatus,
        },
        "system",
        `Detected learning pattern ${candidate.signature}.`
      );
    }

    const rows = db.prepare(`
      SELECT *
      FROM learning_patterns
      ORDER BY updated_at DESC, created_at DESC
    `).all();
    for (const row of rows) {
      patterns.push(normalizePatternRow(row));
    }
    return patterns;
  });
}

function approveLearningPattern(patternId, approvedBy, notes = "") {
  return runInTransaction((db) => {
    const row = db.prepare(`SELECT * FROM learning_patterns WHERE id = ?`).get(String(patternId));
    if (!row) {
      return null;
    }
    const approval = {
      id: `approval_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      patternId: String(patternId),
      approvedBy: String(approvedBy || "operator"),
      approvedAt: nowIso(),
      notes: String(notes || ""),
    };
    db.prepare(`
      INSERT INTO pattern_approvals (id, pattern_id, approved_by, approved_at, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      approval.id,
      approval.patternId,
      approval.approvedBy,
      approval.approvedAt,
      approval.notes
    );
    return approval;
  });
}

function hasPatternApproval(db, patternId) {
  const row = db.prepare(`
    SELECT id
    FROM pattern_approvals
    WHERE pattern_id = ?
    ORDER BY approved_at DESC
    LIMIT 1
  `).get(String(patternId));
  return Boolean(row?.id);
}

function promoteLearningPattern(patternId, approvedBy = "operator", notes = "", policy = {}) {
  const config = buildGovernanceConfig(policy);
  return runInTransaction((db) => {
    const row = db.prepare(`SELECT * FROM learning_patterns WHERE id = ?`).get(String(patternId));
    if (!row) {
      return { ok: false, error: "Pattern not found." };
    }
    const pattern = normalizePatternRow(row);
    let approved = hasPatternApproval(db, patternId);
    if (!approved) {
      db.prepare(`
        INSERT INTO pattern_approvals (id, pattern_id, approved_by, approved_at, notes)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        `approval_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        String(patternId),
        String(approvedBy || "operator"),
        nowIso(),
        String(notes || "")
      );
      approved = true;
    }
    const blockedByContradiction = pattern.contradictionCount >= config.oscillationThreshold || pattern.validationStatus === "conflicting";
    if (!approved || pattern.evidenceCount < config.minimumEvidenceCount || blockedByContradiction) {
      return {
        ok: false,
        error: "Pattern promotion requirements were not satisfied.",
      };
    }
    db.prepare(`
      UPDATE learning_patterns
      SET mode = 'active',
          updated_at = ?
      WHERE id = ?
    `).run(nowIso(), String(patternId));
    appendLearningAudit(
      "learning.pattern_promoted",
      {
        patternId: String(patternId),
        approvedBy: String(approvedBy),
      },
      "operator",
      `Promoted learning pattern ${patternId}.`
    );
    return { ok: true };
  });
}

function buildLearningAdvisory(policy = {}) {
  const patterns = upsertDetectedPatterns(policy);
  const activePatterns = patterns.filter((pattern) => pattern.mode === "active" && pattern.validationStatus === "validated");
  const shadowPatterns = patterns.filter((pattern) => pattern.mode !== "active");
  const hints = activePatterns
    .map((pattern) =>
      normalizeEvidenceBackedItem({
        id: `hint_${pattern.id}`,
        title: pattern.hintPayload?.title || `Pattern ${pattern.scope}`,
        detail: pattern.hintPayload?.detail || "Active learning pattern available.",
        priority: "medium",
        sourceType: "learning_patterns",
        sourceField: "hint_payload",
        reasonCode: pattern.scope,
        confidenceScore: computeEffectiveConfidence(pattern.confidence, pattern.decayRate, pattern.lastSeenAt),
        historicalBasis: {
          patternId: pattern.id,
          evidenceCount: pattern.evidenceCount,
        },
      })
    )
    .filter((hint) => hint.advisoryState === "advisory_complete");

  const shadowSignals = shadowPatterns
    .slice(0, 5)
    .map((pattern) => ({
      id: `shadow_${pattern.id}`,
      title: pattern.shadowPayload?.title || `Shadow pattern ${pattern.scope}`,
      detail: pattern.shadowPayload?.detail || "Pattern remains in shadow mode.",
      confidenceScore: computeEffectiveConfidence(pattern.confidence, pattern.decayRate, pattern.lastSeenAt),
      validationStatus: pattern.validationStatus,
      mode: pattern.mode,
      patternId: pattern.id,
      sourceType: "learning_patterns",
      sourceField: "shadow_payload",
      reasonCode: pattern.scope,
    }));

  const grounded = hints.every((hint) => hint.reasonCode !== "EVIDENCE_INCOMPLETE");
  const confidenceScore = hints.length
    ? Math.max(...hints.map((hint) => Number(hint.confidenceScore || 0)))
    : 0;

  appendLearningAudit(
    "learning.confidence_computed",
    {
      activePatternCount: activePatterns.length,
      shadowPatternCount: shadowPatterns.length,
      confidenceScore,
    },
    "system",
    "Computed governed learning advisory confidence."
  );

  return {
    available: hints.length > 0 && grounded,
    confidenceScore,
    hints,
    shadowSignals,
    generatedAt: nowIso(),
    dataGrounded: grounded && hints.length > 0,
  };
}

function buildGovernedLearningLayer(reviewedPlan, adaptiveReview, policy = {}) {
  const state = loadLearningState();
  const events = listRecentLearningEvents(policy);
  const activation = calculateLearningActivation(events, state);
  const conflicts = detectLearningConflicts(events);
  const stale = detectLearningStaleness(events);
  const markers = [];
  let mode = activation.sufficient ? state.mode : "observation_only";

  if (!activation.sufficient) {
    markers.push("learning_insufficient_data", "observation_only");
  }
  if (conflicts.conflict) {
    markers.push("learning_conflict", "learning_unstable");
  }
  if (stale.stale) {
    markers.push("learning_stale");
  }
  if (mode === "disabled") {
    markers.push("disabled");
  }
  if (mode === "advisory_applied" && (conflicts.conflict || stale.stale)) {
    mode = "observation_only";
  }

  const signalQualityIndicators = buildSignalQualityIndicators(
    events,
    adaptiveReview.recommendation,
    adaptiveReview.attentionPoints
  );
  const operatorPreferenceInsights = buildOperatorPreferenceInsights(events);
  const learningConfidence = buildLearningConfidence(events, activation, markers);
  const learningAdvisory = buildLearningAdvisory(policy);

  let recommendationCalibration = {
    applied: false,
    mode,
    confidenceDelta: 0,
    rankingDelta: 0,
    phrasing: "unchanged",
    reasonCode: activation.sufficient ? "CALIBRATION_FROZEN" : "learning_insufficient_data",
    sourceType: "learning_events",
    sourceField: "events",
    confidenceScore: learningConfidence.score,
  };

  let learningAdjustments = {
    mode,
    markers: [...new Set(markers)],
    adjustments: [],
    rollbackAvailable: true,
  };

  if (mode !== "disabled" && activation.sufficient && !conflicts.conflict && !stale.stale) {
    mode = state.mode === "advisory_applied" ? "advisory_applied" : "observation_only";
    if (mode === "advisory_applied") {
      const positive = events.filter((event) => POSITIVE_OUTCOMES.has(String(event.outcome || ""))).length;
      const negative = events.filter((event) => NEGATIVE_OUTCOMES.has(String(event.outcome || ""))).length;
      const confidenceDelta = positive > negative ? 0.1 : negative > positive ? -0.1 : 0;
      const rankingDelta = signalQualityIndicators.highValueSignals.length > signalQualityIndicators.lowValueSignals.length ? 1 : 0;
      recommendationCalibration = {
        applied: confidenceDelta !== 0 || rankingDelta !== 0,
        mode,
        confidenceDelta,
        rankingDelta,
        phrasing: operatorPreferenceInsights.displayPreference === "compressed" ? "compressed" : "unchanged",
        reasonCode: "advisory_applied",
        sourceType: "learning_events",
        sourceField: "outcome",
        confidenceScore: Math.max(0, Math.min(1, learningConfidence.score)),
      };
      learningAdjustments = {
        mode,
        markers: [...new Set(["advisory_applied", ...markers])],
        adjustments: [
          ...(confidenceDelta !== 0 ? [{ type: "confidence", delta: confidenceDelta }] : []),
          ...(rankingDelta !== 0 ? [{ type: "ranking", delta: rankingDelta }] : []),
          ...(operatorPreferenceInsights.displayPreference === "compressed"
            ? [{ type: "phrasing", value: "compressed" }]
            : []),
        ],
        rollbackAvailable: true,
      };
    }
  }

  if (mode !== "advisory_applied" && !learningAdjustments.markers.includes("observation_only") && mode !== "disabled") {
    learningAdjustments.markers = [...new Set(["observation_only", ...learningAdjustments.markers])];
  }

  const learningSignals = {
    mode,
    markers: [...new Set(mode === "advisory_applied" ? ["advisory_applied", ...markers] : ["observation_only", ...markers])],
    eventCount: activation.eventCount,
    sessionCount: activation.sessionCount,
    sourceType: "learning_events",
    sourceField: "events",
    reasonCode: activation.sufficient ? (mode === "advisory_applied" ? "advisory_applied" : "observation_only") : "learning_insufficient_data",
    confidenceScore: learningConfidence.score,
  };

  if (!learningAdvisory.available) {
    learningSignals.reasonCode = "INSUFFICIENT_EVIDENCE";
  }

  return {
    learningSignals,
    recommendationCalibration,
    signalQualityIndicators,
    operatorPreferenceInsights,
    learningAdjustments,
    learningConfidence,
    learningAdvisory,
  };
}

function applyLearningToAdaptiveReview(adaptiveReview, learningLayer) {
  const recommendation = {
    ...adaptiveReview.recommendation,
    confidenceScore: Math.max(
      0,
      Math.min(
        1,
        Number(adaptiveReview.recommendation?.confidenceScore ?? 0.5) +
          Number(learningLayer.recommendationCalibration.confidenceDelta || 0)
      )
    ),
  };

  const attentionPoints = [...(adaptiveReview.attentionPoints || [])];
  if (learningLayer.recommendationCalibration.rankingDelta > 0 && attentionPoints.length > 1) {
    attentionPoints.sort((left, right) => {
      const leftPriority = left.priority === "high" ? 3 : left.priority === "medium" ? 2 : 1;
      const rightPriority = right.priority === "high" ? 3 : right.priority === "medium" ? 2 : 1;
      return rightPriority - leftPriority;
    });
  }

  const summary = {
    ...adaptiveReview.summary,
    bullets:
      learningLayer.operatorPreferenceInsights.displayPreference === "compressed"
        ? (adaptiveReview.summary?.bullets || []).slice(0, 2)
        : adaptiveReview.summary?.bullets || [],
  };

  return {
    ...adaptiveReview,
    recommendation,
    attentionPoints,
    summary,
    ...learningLayer,
  };
}

module.exports = {
  LEARNING_STATE_KEY,
  LEARNING_STATE_PATH,
  defaultLearningState,
  loadLearningState,
  saveLearningState,
  recordLearningEvent,
  setLearningMode,
  resetLearningState,
  listRecentLearningEvents,
  calculateLearningActivation,
  detectLearningConflicts,
  detectLearningStaleness,
  computeEffectiveConfidence,
  listLearningPatterns,
  upsertDetectedPatterns,
  approveLearningPattern,
  promoteLearningPattern,
  buildLearningAdvisory,
  buildGovernedLearningLayer,
  applyLearningToAdaptiveReview,
};
