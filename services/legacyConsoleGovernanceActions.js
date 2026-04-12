function acknowledgeApprovalTrustAlert(actor, payload = {}, deps) {
  const alertId = String(payload.alertId || "").trim();
  if (!alertId) {
    return { ok: false, error: "Trust alert ID is required." };
  }
  const collaboration = deps.loadCollaborationState();
  const governance = collaboration.governance || {};
  const existing = Array.isArray(governance.approvalTrustAlertAcks) ? governance.approvalTrustAlertAcks : [];
  const nextEntry = {
    alertId,
    acknowledgedAt: new Date().toISOString(),
    acknowledgedById: actor.id,
    acknowledgedByName: actor.name,
  };
  deps.updateGovernance({
    ...governance,
    approvalTrustAlertAcks: [nextEntry, ...existing.filter((item) => String(item.alertId) !== alertId)].slice(0, 100),
  });
  return {
    ok: true,
    output: `Acknowledged trust alert ${alertId}.`,
  };
}

function restartApprovalRecommendationObservation(actor, payload = {}, deps) {
  const recommendationId = String(payload.recommendationId || "").trim();
  if (!recommendationId) {
    return { ok: false, error: "Recommendation ID is required." };
  }
  const collaboration = deps.loadCollaborationState();
  const governance = collaboration.governance || {};
  const observations = Array.isArray(governance.approvalRecommendationObservations)
    ? governance.approvalRecommendationObservations
    : [];
  const now = new Date().toISOString();
  let found = false;
  const next = observations.map((item) => {
    if (String(item.recommendationId) !== recommendationId) {
      return item;
    }
    found = true;
    return {
      ...item,
      firstObservedAt: now,
      eligibleSinceAt: now,
      lastObservedAt: now,
      cooldownUntil: null,
      status: "observing",
    };
  });
  if (!found) {
    return { ok: false, error: `Recommendation observation not found: ${recommendationId}.` };
  }
  deps.updateGovernance({
    ...governance,
    approvalRecommendationObservations: next,
    approvalTrustAlertAcks: (Array.isArray(governance.approvalTrustAlertAcks) ? governance.approvalTrustAlertAcks : []).filter(
      (item) => !String(item.alertId || "").includes(recommendationId)
    ),
  });
  return {
    ok: true,
    output: `Restarted observation for ${recommendationId}.`,
  };
}

function extendApprovalRecommendationCooldown(actor, payload = {}, deps) {
  const recommendationId = String(payload.recommendationId || "").trim();
  const hours = Math.max(1, Number(payload.hours || 24));
  if (!recommendationId) {
    return { ok: false, error: "Recommendation ID is required." };
  }
  const collaboration = deps.loadCollaborationState();
  const governance = collaboration.governance || {};
  const observations = Array.isArray(governance.approvalRecommendationObservations)
    ? governance.approvalRecommendationObservations
    : [];
  let found = false;
  const cooldownUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  const next = observations.map((item) => {
    if (String(item.recommendationId) !== recommendationId) {
      return item;
    }
    found = true;
    return {
      ...item,
      cooldownUntil,
      lastObservedAt: new Date().toISOString(),
      status: "cooldown",
    };
  });
  if (!found) {
    return { ok: false, error: `Recommendation observation not found: ${recommendationId}.` };
  }
  deps.updateGovernance({
    ...governance,
    approvalRecommendationObservations: next,
    approvalTrustAlertAcks: (Array.isArray(governance.approvalTrustAlertAcks) ? governance.approvalTrustAlertAcks : []).filter(
      (item) => !String(item.alertId || "").includes(recommendationId)
    ),
  });
  return {
    ok: true,
    output: `Extended cooldown for ${recommendationId} by ${hours} hours.`,
  };
}

function buildApprovalPolicyPromotionEntry(payload, actor, beforeSnapshot, outcome, deps) {
  return {
    id: `approval_policy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    recommendationId: String(payload.recommendationId || payload.recommendationKind || "approval-policy"),
    recommendationKind: String(payload.recommendationKind || "policy"),
    environment: outcome.environment || String(payload.environment || "development"),
    target: String(payload.target || "") || null,
    workspaceId: String(payload.workspaceId || "") || null,
    title: String(payload.recommendationTitle || payload.recommendationId || "Approval policy change"),
    appliedAt: new Date().toISOString(),
    appliedById: actor.id,
    appliedByName: actor.name,
    appliedAutomatically: Boolean(outcome.automatic),
    effectSummary: deps.summarizeApprovalPolicyRecommendationEffect(payload, outcome),
    metricsSnapshot: deps.buildApprovalPolicyMetricsSnapshot(payload),
    beforeSnapshot,
    afterSnapshot: {
      capacityLimit: outcome.capacityLimit || null,
      backupApproverTarget: outcome.backupApproverTarget || null,
    },
  };
}

function observeApprovalPolicyRecommendations(recommendations = [], environmentPolicy = {}, deps) {
  const collaboration = deps.loadCollaborationState();
  const governance = collaboration.governance || {};
  const observations = Array.isArray(governance.approvalRecommendationObservations)
    ? governance.approvalRecommendationObservations
    : [];
  const observationById = new Map(observations.map((item) => [String(item.recommendationId), item]));
  const minConfidence = Math.max(0.5, Math.min(0.99, Number(environmentPolicy.autoPromoteRecommendationConfidence || 0.9)));
  const now = new Date();
  let changed = false;

  const next = (Array.isArray(recommendations) ? recommendations : []).map((recommendation) => {
    const recommendationId = String(recommendation.id || recommendation.promoteAction?.payload?.recommendationId || "");
    const existing = observationById.get(recommendationId) || {};
    const cooldownUntil = existing.cooldownUntil ? new Date(existing.cooldownUntil) : null;
    const inCooldown = Boolean(cooldownUntil && cooldownUntil.getTime() > now.getTime());
    const confidence = Number(recommendation.confidence?.score || 0);
    const eligibleNow = confidence >= minConfidence && !inCooldown;
    const status = inCooldown ? "cooldown" : eligibleNow ? "observing" : "watching";
    const candidate = {
      recommendationId,
      title: recommendation.title,
      environment: String(environmentPolicy.currentEnvironment || "development"),
      firstObservedAt: existing.firstObservedAt || now.toISOString(),
      eligibleSinceAt: eligibleNow ? existing.eligibleSinceAt || now.toISOString() : null,
      cooldownUntil: inCooldown ? cooldownUntil.toISOString() : null,
      lastObservedAt: now.toISOString(),
      lastConfidence: confidence,
      status,
      lastPromotionAt: existing.lastPromotionAt || null,
    };
    if (JSON.stringify(candidate) !== JSON.stringify(existing)) {
      changed = true;
    }
    return candidate;
  });

  if (changed || next.length !== observations.length) {
    deps.updateGovernance({
      ...governance,
      approvalRecommendationObservations: next,
    });
  }
  return next;
}

function applyApprovalPolicyRecommendationChange(
  actor,
  payload = {},
  options = {},
  deps,
  { persistPromotion = false, automatic = false, includeOverview = true } = {}
) {
  const recommendationKind = String(payload.recommendationKind || "").trim();
  const recommendationId = String(payload.recommendationId || recommendationKind || "approval-policy");
  const workspaceId = String(payload.workspaceId || "").trim();
  const target = String(payload.target || "").trim();
  const collaborationState = deps.loadCollaborationState();
  const environment = String(payload.environment || collaborationState.governance.currentEnvironment || "development").trim();
  const nextEnvironmentPolicy = {
    ...deps.getEnvironmentPolicy(collaborationState.governance),
    ...(collaborationState.governance.environmentPolicies?.[environment] || {}),
  };
  const beforeSnapshot = {
    capacityLimit: Math.max(1, Number(nextEnvironmentPolicy.incidentApprovalCapacityLimit || 1)),
    backupApproverTarget: workspaceId ? deps.getDigestWorkspaceState(workspaceId).backupApproverTarget || null : null,
  };
  const now = new Date().toISOString();

  if (recommendationKind === "workspace" && workspaceId) {
    const backupApproverTarget = String(payload.suggestedBackupApproverTarget || "").trim();
    if (backupApproverTarget) {
      deps.updateDigestWorkspaceState(workspaceId, {
        backupApproverTarget,
        backupApproverAssignedBy: actor.id,
        backupApproverAssignedAt: now,
      });
      deps.appendDigestWorkspaceEvent(workspaceId, {
        type: persistPromotion ? "approval-policy-promoted" : "approval-policy-recommendation-applied",
        message: `${persistPromotion ? "Promoted" : "Applied"} policy recommendation ${recommendationId}.`,
        actorId: actor.id,
        actorName: actor.name,
        note: `Assigned ${backupApproverTarget} as the backup approver.`,
      });
      if (persistPromotion) {
        deps.updateGovernance({
          ...deps.loadCollaborationState().governance,
          appliedApprovalPolicies: [
            buildApprovalPolicyPromotionEntry(
              payload,
              actor,
              beforeSnapshot,
              { environment, backupApproverTarget, automatic },
              deps
            ),
            ...(deps.loadCollaborationState().governance.appliedApprovalPolicies || []),
          ].slice(0, 20),
        });
      }
      deps.appendAuditEvent({
        type: persistPromotion ? "collaboration:promote-approval-policy-recommendation" : "collaboration:apply-approval-policy-recommendation",
        message: `${automatic ? "Automatically " : ""}${persistPromotion ? "promoted" : "applied"} workspace approval recommendation for ${workspaceId}.`,
        payload: {
          recommendationId,
          recommendationKind,
          workspaceId,
          backupApproverTarget,
          actorId: actor.id,
          beforeSnapshot,
        },
      });
      const result = {
        ok: true,
        output: `Assigned ${backupApproverTarget} as the backup approver for ${workspaceId}.`,
      };
      if (includeOverview) {
        result.overview = deps.buildOverview(options);
      }
      return result;
    }
  }

  const suggestedCapacityLimit = Math.max(
    1,
    Number(payload.suggestedCapacityLimit || nextEnvironmentPolicy.incidentApprovalCapacityLimit || 1)
  );
  const updatedGovernance = deps.updateGovernance({
    ...collaborationState.governance,
    environmentPolicies: {
      ...(collaborationState.governance.environmentPolicies || {}),
      [environment]: {
        ...(collaborationState.governance.environmentPolicies?.[environment] || {}),
        incidentApprovalCapacityLimit: suggestedCapacityLimit,
      },
    },
    appliedApprovalPolicies: persistPromotion
      ? [
          buildApprovalPolicyPromotionEntry(
            payload,
            actor,
            beforeSnapshot,
            { environment, capacityLimit: suggestedCapacityLimit, automatic },
            deps
          ),
          ...(collaborationState.governance.appliedApprovalPolicies || []),
        ].slice(0, 20)
      : collaborationState.governance.appliedApprovalPolicies || [],
  });

  const digestScheduler = deps.getDigestSchedulerStatus();
  const affectedWorkspaces = deps.buildDigestWorkspaceHealth(digestScheduler)
    .filter((item) => {
      if (workspaceId) {
        return item.workspaceId === workspaceId;
      }
      if (target) {
        return (
          deps.normalizeTarget(item.incidentApproverTarget) === deps.normalizeTarget(target) ||
          deps.normalizeTarget(item.incidentApproval?.approverTarget) === deps.normalizeTarget(target)
        );
      }
      return false;
    })
    .slice(0, 5);
  affectedWorkspaces.forEach((item) => {
    deps.appendDigestWorkspaceEvent(item.workspaceId, {
      type: persistPromotion ? "approval-policy-promoted" : "approval-policy-recommendation-applied",
      message: `${persistPromotion ? "Promoted" : "Applied"} policy recommendation ${recommendationId}.`,
      actorId: actor.id,
      actorName: actor.name,
      note: `Set ${environment} approval capacity limit to ${suggestedCapacityLimit}.`,
    });
  });
  deps.appendAuditEvent({
    type: persistPromotion ? "collaboration:promote-approval-policy-recommendation" : "collaboration:apply-approval-policy-recommendation",
    message: `${automatic ? "Automatically " : ""}${persistPromotion ? "promoted" : "applied"} approval policy recommendation.`,
    payload: {
      recommendationId,
      recommendationKind,
      environment,
      target: target || null,
      workspaceId: workspaceId || null,
      suggestedCapacityLimit,
      actorId: actor.id,
      beforeSnapshot,
      governance: updatedGovernance,
    },
  });
  const result = {
    ok: true,
    output: `Set the ${environment} approval capacity limit to ${suggestedCapacityLimit}.`,
  };
  if (includeOverview) {
    result.overview = deps.buildOverview(options);
  }
  return result;
}

function rollbackApprovalPolicyPromotion(actor, payload = {}, options = {}, deps) {
  const promotionId = String(payload.promotionId || "").trim();
  const collaborationState = deps.loadCollaborationState();
  const policies = Array.isArray(collaborationState.governance?.appliedApprovalPolicies)
    ? collaborationState.governance.appliedApprovalPolicies
    : [];
  const existing = policies.find((item) => item.id === promotionId);
  if (!existing) {
    return { ok: false, error: `Promoted policy not found: ${promotionId}`, overview: deps.buildOverview(options) };
  }
  const environment = String(existing.environment || collaborationState.governance.currentEnvironment || "development");
  const cooldownHours = Math.max(
    1,
    Number(collaborationState.governance.environmentPolicies?.[environment]?.autoPromoteCooldownHours || 72)
  );
  const cooldownUntil = new Date(Date.now() + cooldownHours * 60 * 60 * 1000).toISOString();
  const nextGovernance = {
    ...collaborationState.governance,
    environmentPolicies: {
      ...(collaborationState.governance.environmentPolicies || {}),
      [environment]: {
        ...(collaborationState.governance.environmentPolicies?.[environment] || {}),
        incidentApprovalCapacityLimit: Math.max(
          1,
          Number(
            existing.beforeSnapshot?.capacityLimit ||
              collaborationState.governance.environmentPolicies?.[environment]?.incidentApprovalCapacityLimit ||
              1
          )
        ),
      },
    },
    appliedApprovalPolicies: policies.map((item) =>
      item.id === promotionId
        ? {
            ...item,
            rolledBackAt: new Date().toISOString(),
            rolledBackById: actor.id,
            rolledBackByName: actor.name,
          }
        : item
    ),
    approvalRecommendationObservations: (Array.isArray(collaborationState.governance.approvalRecommendationObservations)
      ? collaborationState.governance.approvalRecommendationObservations
      : []
    ).map((item) =>
      item.recommendationId === existing.recommendationId
        ? {
            ...item,
            cooldownUntil,
            eligibleSinceAt: null,
            status: "cooldown",
            lastObservedAt: new Date().toISOString(),
          }
        : item
    ),
  };
  deps.updateGovernance(nextGovernance);
  if (existing.workspaceId) {
    deps.updateDigestWorkspaceState(existing.workspaceId, {
      backupApproverTarget: existing.beforeSnapshot?.backupApproverTarget || null,
      backupApproverAssignedBy: actor.id,
      backupApproverAssignedAt: new Date().toISOString(),
    });
    deps.appendDigestWorkspaceEvent(existing.workspaceId, {
      type: "approval-policy-rolled-back",
      message: `Rolled back promoted policy ${existing.title}.`,
      actorId: actor.id,
      actorName: actor.name,
      note: existing.effectSummary,
    });
  }
  deps.appendAuditEvent({
    type: "collaboration:rollback-approval-policy",
    message: `Rolled back promoted approval policy ${existing.title}.`,
    payload: { promotionId, actorId: actor.id },
  });
  return {
    ok: true,
    output: `Rolled back promoted policy ${existing.title}.`,
    overview: deps.buildOverview(options),
  };
}

function autoPromoteApprovalRecommendations(actor, recommendations = [], environmentPolicy = {}, options = {}, deps) {
  if (!environmentPolicy.autoPromoteApprovalRecommendations) {
    return false;
  }
  const minConfidence = Math.max(0.5, Math.min(0.99, Number(environmentPolicy.autoPromoteRecommendationConfidence || 0.9)));
  const observationHours = Math.max(1, Number(environmentPolicy.autoPromoteObservationHours || 24));
  const collaboration = deps.loadCollaborationState();
  const existing = Array.isArray(collaboration.governance?.appliedApprovalPolicies)
    ? collaboration.governance.appliedApprovalPolicies
    : [];
  const observations = Array.isArray(collaboration.governance?.approvalRecommendationObservations)
    ? collaboration.governance.approvalRecommendationObservations
    : [];
  const observationById = new Map(observations.map((item) => [String(item.recommendationId), item]));
  let changed = false;

  (Array.isArray(recommendations) ? recommendations : [])
    .filter((item) => item.promoteAction?.payload)
    .filter((item) => Number(item.confidence?.score || 0) >= minConfidence)
    .forEach((item) => {
      const recommendationId = String(item.id || item.promoteAction.payload.recommendationId || "");
      const observation = observationById.get(recommendationId);
      const alreadyApplied = existing.some((entry) => entry.recommendationId === recommendationId && !entry.rolledBackAt);
      const eligibleSince = observation?.eligibleSinceAt ? new Date(observation.eligibleSinceAt).getTime() : null;
      const matured =
        Number.isFinite(eligibleSince) &&
        Date.now() - Number(eligibleSince) >= observationHours * 60 * 60 * 1000;
      if (alreadyApplied || !matured) {
        return;
      }
      applyApprovalPolicyRecommendationChange(
        actor,
        { ...item.promoteAction.payload, recommendationId, recommendationTitle: item.title },
        options,
        deps,
        { persistPromotion: true, automatic: true, includeOverview: false }
      );
      changed = true;
    });

  return changed;
}

module.exports = {
  acknowledgeApprovalTrustAlert,
  restartApprovalRecommendationObservation,
  extendApprovalRecommendationCooldown,
  observeApprovalPolicyRecommendations,
  applyApprovalPolicyRecommendationChange,
  rollbackApprovalPolicyPromotion,
  autoPromoteApprovalRecommendations,
};
