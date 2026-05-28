"use strict";

function explainRecoveryLearningReport({ learningSignals, recommendations } = {}) {
  if (!learningSignals || typeof learningSignals !== "object" || !Array.isArray(recommendations)) {
    throw new Error("Learning signals and recommendations are required.");
  }

  const totals = learningSignals.totals || {};
  const warnings = Array.isArray(learningSignals.warnings) ? learningSignals.warnings : [];
  const keyFindings = [
    `Verified outcomes observed: ${Number(totals.verified || 0)}.`,
    `Failed outcomes observed: ${Number(totals.failed || 0)}.`,
    `Unknown outcomes observed: ${Number(totals.unknown || 0)}.`,
  ];

  if (Number(totals.partial || 0) > 0) {
    keyFindings.push(`Partial outcomes observed: ${Number(totals.partial || 0)}.`);
  }
  if (Number(totals.noMutationConfirmed || 0) > 0) {
    keyFindings.push(`No-mutation confirmations observed: ${Number(totals.noMutationConfirmed || 0)}.`);
  }
  if (warnings.length > 0) {
    keyFindings.push(`Missing evidence warnings: ${warnings.join(", ")}.`);
  }

  return {
    summary: "This recovery learning report is advisory only. No policy was changed automatically.",
    keyFindings,
    recommendations: recommendations.map((item) => ({
      target: item.target,
      recommendation: item.recommendation,
      severity: item.severity,
      confidence: item.confidence,
      reason: item.reason,
    })),
    safetyNotes: [
      "Recommendations are operator-facing and advisory only.",
      "No execution state, approval path, or recovery policy was changed automatically.",
      "Warnings should be reviewed before adjusting autonomy, throttles, or allowlists.",
    ],
  };
}

module.exports = {
  explainRecoveryLearningReport,
};
