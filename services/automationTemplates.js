const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { loadDocument, saveDocument } = require("./stateDatabase");
const { getAgentsDataPath } = require("./runtimePaths");

const STATE_KEY = "automationTemplates";
const LEGACY_PATH = getAgentsDataPath("automation-templates.json");
const MAX_TEMPLATE_STEPS = 6;

const STEP_CATALOG = Object.freeze([
  {
    action: "watcher:preview",
    label: "Preview watcher rules",
    description: "Evaluate watcher matches without changing schedules or watcher history.",
    risk: "read_only",
    requiresConfirmation: false,
    defaultPayload: {},
  },
  {
    action: "alert:run-checks",
    label: "Run alert checks",
    description: "Evaluate operational thresholds and update alert state.",
    risk: "controlled_write",
    requiresConfirmation: true,
    defaultPayload: {},
  },
  {
    action: "watcher:start",
    label: "Start watcher",
    description: "Start governed watcher evaluation with a bounded interval.",
    risk: "controlled_write",
    requiresConfirmation: true,
    defaultPayload: { intervalSeconds: 5 },
  },
]);

function now() {
  return new Date().toISOString();
}

function createId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function defaultState() {
  const timestamp = now();
  return {
    version: 1,
    templates: [
      {
        id: "preset_operational_readiness",
        name: "Operational readiness sweep",
        description: "Preview watcher demand, then refresh operational alerts.",
        builtIn: true,
        steps: [
          { id: "preset_step_watcher_preview", action: "watcher:preview", payload: {} },
          { id: "preset_step_alert_checks", action: "alert:run-checks", payload: {} },
        ],
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function ensureStateDir() {
  fs.mkdirSync(path.dirname(LEGACY_PATH), { recursive: true });
}

function normalizePayload(action, payload = {}) {
  if (action === "watcher:start") {
    const parsed = Number(payload.intervalSeconds || 5);
    return {
      intervalSeconds: Math.min(3600, Math.max(1, Number.isFinite(parsed) ? Math.round(parsed) : 5)),
    };
  }

  return {};
}

function normalizeStep(step = {}, index = 0) {
  const action = String(step.action || "").trim();
  return {
    id: String(step.id || createId(`automation_step_${index + 1}`)),
    action,
    payload: normalizePayload(action, step.payload && typeof step.payload === "object" ? step.payload : {}),
  };
}

function normalizeTemplate(template = {}) {
  return {
    id: String(template.id || createId("automation_template")),
    name: String(template.name || "").trim().slice(0, 80),
    description: String(template.description || "").trim().slice(0, 240),
    builtIn: Boolean(template.builtIn),
    steps: Array.isArray(template.steps) ? template.steps.map(normalizeStep) : [],
    createdAt: String(template.createdAt || now()),
    updatedAt: String(template.updatedAt || now()),
  };
}

function normalizeState(state = {}) {
  const fallback = defaultState();
  return {
    version: 1,
    templates: Array.isArray(state.templates) ? state.templates.map(normalizeTemplate) : fallback.templates,
    createdAt: String(state.createdAt || fallback.createdAt),
    updatedAt: String(state.updatedAt || fallback.updatedAt),
  };
}

function loadAutomationTemplatesState() {
  ensureStateDir();
  return normalizeState(loadDocument(STATE_KEY, defaultState, { legacyPath: LEGACY_PATH }));
}

function saveAutomationTemplatesState(state) {
  ensureStateDir();
  const normalized = normalizeState({ ...state, updatedAt: now() });
  return saveDocument(STATE_KEY, normalized, { legacyPath: LEGACY_PATH });
}

function getAutomationStepCatalog() {
  return STEP_CATALOG.map((item) => ({
    ...item,
    defaultPayload: { ...item.defaultPayload },
  }));
}

function listAutomationTemplates() {
  return loadAutomationTemplatesState().templates;
}

function getAutomationTemplate(templateId) {
  return listAutomationTemplates().find((template) => template.id === String(templateId || "")) || null;
}

function preflightAutomationTemplate(input = {}) {
  const template = normalizeTemplate(input);
  const errors = [];
  const actionCounts = new Map();

  if (!template.name) {
    errors.push("Template name is required.");
  }
  if (!template.steps.length) {
    errors.push("Add at least one automation step.");
  }
  if (template.steps.length > MAX_TEMPLATE_STEPS) {
    errors.push(`Templates are limited to ${MAX_TEMPLATE_STEPS} steps.`);
  }

  const stepChecks = template.steps.map((step, index) => {
    const catalogEntry = STEP_CATALOG.find((item) => item.action === step.action) || null;
    actionCounts.set(step.action, (actionCounts.get(step.action) || 0) + 1);
    if (!catalogEntry) {
      errors.push(`Step ${index + 1} uses unsupported action ${step.action || "(empty)"}.`);
    }

    return {
      id: step.id,
      index,
      action: step.action,
      label: catalogEntry?.label || "Unsupported action",
      risk: catalogEntry?.risk || "blocked",
      requiresConfirmation: Boolean(catalogEntry?.requiresConfirmation),
      allowed: Boolean(catalogEntry),
      payload: step.payload,
    };
  });

  for (const [action, count] of actionCounts.entries()) {
    if (action && count > 1) {
      errors.push(`Action ${action} may only appear once in a template.`);
    }
  }

  const requiresConfirmation = stepChecks.some((step) => step.requiresConfirmation);
  return {
    ok: errors.length === 0,
    status: errors.length ? "blocked" : requiresConfirmation ? "ready_for_confirmation" : "ready",
    errors,
    requiresConfirmation,
    template,
    stepChecks,
    summary: {
      stepCount: template.steps.length,
      readOnlySteps: stepChecks.filter((step) => step.risk === "read_only").length,
      controlledWriteSteps: stepChecks.filter((step) => step.risk === "controlled_write").length,
      blockedSteps: stepChecks.filter((step) => !step.allowed).length,
    },
  };
}

function saveAutomationTemplate(input = {}) {
  const state = loadAutomationTemplatesState();
  const existing = state.templates.find((template) => template.id === String(input.id || "")) || null;
  if (existing?.builtIn) {
    throw new Error("Built-in automation templates cannot be modified.");
  }

  const candidate = normalizeTemplate({
    ...input,
    id: existing?.id || input.id,
    builtIn: false,
    createdAt: existing?.createdAt || input.createdAt,
    updatedAt: now(),
  });
  const preflight = preflightAutomationTemplate(candidate);
  if (!preflight.ok) {
    throw new Error(preflight.errors.join(" "));
  }

  const nextTemplates = existing
    ? state.templates.map((template) => (template.id === existing.id ? candidate : template))
    : [...state.templates, candidate];
  saveAutomationTemplatesState({ ...state, templates: nextTemplates });
  return candidate;
}

function deleteAutomationTemplate(templateId) {
  const state = loadAutomationTemplatesState();
  const existing = state.templates.find((template) => template.id === String(templateId || ""));
  if (!existing) {
    return false;
  }
  if (existing.builtIn) {
    throw new Error("Built-in automation templates cannot be deleted.");
  }

  saveAutomationTemplatesState({
    ...state,
    templates: state.templates.filter((template) => template.id !== existing.id),
  });
  return true;
}

module.exports = {
  MAX_TEMPLATE_STEPS,
  loadAutomationTemplatesState,
  saveAutomationTemplatesState,
  getAutomationStepCatalog,
  listAutomationTemplates,
  getAutomationTemplate,
  preflightAutomationTemplate,
  saveAutomationTemplate,
  deleteAutomationTemplate,
};
