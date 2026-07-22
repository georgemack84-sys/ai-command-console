import { ApiClientError, fetchJson, renderHealthSummary } from "./api-client.js";

const app = document.querySelector("#app");
const state = {
  user: null,
  session: null,
  health: null,
  error: null,
};

const routes = {
  "/": renderHome,
  "/setup": renderSetup,
  "/login": renderLogin,
  "/health": renderHealth,
  "/today": renderToday,
  "/calendar": renderCalendar,
  "/calendar/day": renderCalendar,
  "/calendar/week": renderCalendar,
  "/calendar/month": renderCalendar,
  "/calendar/agenda": renderCalendar,
  "/calendars": renderCalendars,
  "/notes": renderNotes,
  "/notebooks": renderNotes,
  "/search": renderSearch,
  "/attachments": renderAttachments,
  "/knowledge": renderMemory,
  "/memory": renderMemory,
  "/preferences": renderMemory,
  "/automation": renderAutomation,
  "/routines": renderAutomation,
  "/integrations": renderConnectors,
  "/connectors": renderConnectors,
  "/operations": renderOperations,
  "/diagnostics": renderOperations,
  "/assistant": renderAssistant,
  "/conversations": renderConversations,
  "/assistant/settings": renderAssistantSettings,
  "/assistant/plans": renderAssistantPlans,
  "/assistant/actions": renderAssistantActions,
  "/tasks": renderTasks,
  "/reminders": renderReminders,
  "/contacts": renderFollowups,
  "/follow-ups": renderFollowups,
  "/activity": renderActivity,
  "/settings": renderSettings,
  "/settings/profile": renderSettings,
  "/settings/preferences": renderSettings,
  "/settings/security": renderSecurity,
  "/settings/sessions": renderSessions,
  "/session-expired": renderSessionExpired,
  "/error": renderErrorPage,
};

async function boot() {
  await loadSession();
  await loadHealth();
  await route();
}

async function loadSession() {
  try {
    const payload = await fetchJson("/api/v1/auth/session");
    state.user = payload.user;
    state.session = payload.session;
  } catch {
    state.user = null;
    state.session = null;
  }
}

async function loadHealth() {
  try {
    state.health = await fetchJson("/api/v1/health");
  } catch {
    state.health = null;
  }
}

async function route() {
  state.error = null;
  const path = window.location.pathname;
  const publicRoutes = new Set(["/setup", "/login", "/session-expired", "/error"]);
  const setupStatus = await safeFetch("/api/v1/auth/setup-status");

  if (setupStatus?.setup_required && path !== "/setup") {
    navigate("/setup");
    return;
  }
  if (!setupStatus?.setup_required && path === "/setup") {
    navigate("/login");
    return;
  }
  if (!state.user && !publicRoutes.has(path)) {
    navigate("/login");
    return;
  }

  const renderer = path.startsWith("/notes/")
    ? renderNoteEditor
    : path.startsWith("/conversations/")
      ? renderConversationDetail
      : routes[path] ?? renderNotFound;
  renderer();
}

function shell(content, options = {}) {
  const signedIn = Boolean(state.user);
  const routeClass = `route-${window.location.pathname.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home"}`.toLowerCase();
  app.innerHTML = `
    <header class="topbar">
      ${
        signedIn
          ? `<button class="nav-toggle" id="nav-toggle" type="button" aria-label="Open navigation" aria-controls="primary-navigation" aria-expanded="false">Menu</button>`
          : ""
      }
      <a class="brand" href="/" data-link>
        <span class="brand-mark" aria-hidden="true">D2D</span>
        <span>Day-to-Day Assistant</span>
      </a>
      ${
        signedIn
          ? `<form class="global-search" role="search">
              <label class="sr-only" for="global-search-input">Search anything</label>
              <input id="global-search-input" type="search" placeholder="Search anything..." />
              <span aria-hidden="true">Ctrl K</span>
            </form>`
          : ""
      }
      <div class="status-line">
        <span>${state.health?.environment ?? "development"}</span>
        <span>${state.health?.version ?? "0.1.0-bootstrap"}</span>
        <span>${state.health ? renderHealthSummary(state.health) : "API unavailable"}</span>
      </div>
      ${
        signedIn
          ? `<div class="user-menu">
              <span>${escapeHtml(state.user.display_name)}</span>
              <a href="/settings" data-link>Settings</a>
              <button id="logout-button" type="button">Sign out</button>
            </div>`
          : ""
      }
    </header>
    ${
      signedIn
        ? `<div class="app-frame">
            <nav class="nav" id="primary-navigation" aria-label="Primary">
              <div class="nav-section">
                ${navLink("/", "Home", "home")}
                ${navLink("/conversations", "Conversations", "chat")}
                ${navLink("/tasks", "Tasks", "task")}
                ${navLink("/calendar", "Calendar", "calendar")}
                ${navLink("/reminders", "Reminders", "bell")}
                ${navLink("/notes", "Notes", "note")}
              </div>
              <div class="nav-section">
                ${navLink("/knowledge", "Knowledge", "book")}
                ${navLink("/contacts", "Contacts", "people")}
                ${navLink("/routines", "Routines", "loop")}
                ${navLink("/automation", "Automations", "bolt")}
                ${navLink("/activity", "Activity", "pulse")}
                ${navLink("/integrations", "Integrations", "plug")}
              </div>
              <div class="nav-section">
                ${navLink("/settings", "Settings", "gear")}
                ${navLink("/diagnostics", "Diagnostics", "shield")}
              </div>
            </nav>
            <main id="main" class="${options.narrow ? `main narrow ${routeClass}` : `main ${routeClass}`}" tabindex="-1">
              ${state.error ? `<div class="error" role="alert">${escapeHtml(state.error)}</div>` : ""}
              ${content}
            </main>
          </div>
          <nav class="bottom-nav" aria-label="Primary quick navigation">
            ${navLink("/today", "Today")}
            ${navLink("/assistant", "Assistant")}
            ${navLink("/calendar", "Calendar")}
            ${navLink("/tasks", "Tasks")}
            ${navLink("/settings", "Settings")}
          </nav>`
        : ""
    }
    ${
      signedIn
        ? ""
        : `<main id="main" class="${options.narrow ? `main narrow ${routeClass}` : `main ${routeClass}`}" tabindex="-1">
            ${state.error ? `<div class="error" role="alert">${escapeHtml(state.error)}</div>` : ""}
            ${content}
          </main>`
    }
  `;
  bindLinks();
  bindShellControls();
  document.querySelector("#logout-button")?.addEventListener("click", logout);
}

function navLink(path, label) {
  const active = window.location.pathname === path ? "aria-current=\"page\"" : "";
  const icon = arguments.length > 2 ? `<span class="nav-icon" aria-hidden="true">${escapeHtml(String(arguments[2]).slice(0, 2))}</span>` : "";
  return `<a href="${path}" data-link ${active}>${icon}<span>${label}</span></a>`;
}

async function renderHome() {
  await renderCommandCenter();
}

function renderSetup() {
  shell(`
    <section class="page-header"><h1>Create local account</h1><p>This setup is available only before the first active account exists.</p></section>
    <form id="setup-form" class="form">
      <label>Email <input name="email" type="email" autocomplete="username" required /></label>
      <label>Display name <input name="display_name" required /></label>
      <label>Password <input name="password" type="password" autocomplete="new-password" required /></label>
      <label>Confirm password <input name="password_confirmation" type="password" autocomplete="new-password" required /></label>
      <label>Timezone <input name="timezone" value="America/New_York" required /></label>
      <label>Locale <input name="locale" value="en-US" required /></label>
      <button type="submit">Create account</button>
    </form>
  `, { narrow: true });
  document.querySelector("#setup-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = formBody(event.target);
    await submit(() => fetchJson("/api/v1/auth/setup", { method: "POST", body }), async () => {
      navigate("/login");
    });
  });
}

function renderLogin() {
  shell(`
    <section class="page-header"><h1>Sign in</h1><p>Use your local Day-to-Day Assistant account.</p></section>
    <form id="login-form" class="form">
      <label>Email <input name="identifier" type="email" autocomplete="username" required /></label>
      <label>Password <input name="password" type="password" autocomplete="current-password" required /></label>
      <label class="check"><input name="remember_session" type="checkbox" /> Remember this browser</label>
      <button type="submit">Sign in</button>
    </form>
  `, { narrow: true });
  document.querySelector("#login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = formBody(event.target);
    body.remember_session = Boolean(event.target.elements.remember_session.checked);
    await submit(() => fetchJson("/api/v1/auth/login", { method: "POST", body }), async () => {
      await loadSession();
      navigate("/");
    }, "The email or password is incorrect.");
  });
}

function renderHealth() {
  shell(`
    <section class="page-header"><h1>Application health</h1><p>Safe runtime status for the local application.</p></section>
    <pre class="json">${escapeHtml(JSON.stringify(state.health ?? {}, null, 2))}</pre>
  `);
}

async function renderToday() {
  await renderCommandCenter();
}

async function renderCommandCenter() {
  const payload = await safeFetch("/api/v1/today");
  const today = payload?.today ?? {};
  const [notesPayload, conversationsPayload, connectorsPayload, operationsPayload] = await Promise.all([
    safeFetch("/api/v1/notes"),
    safeFetch("/api/v1/conversations"),
    safeFetch("/api/v1/connectors"),
    safeFetch("/api/v1/system/health"),
  ]);
  const tasks = [...(today.overdue_tasks ?? []), ...(today.due_today_tasks ?? [])];
  const events = today.calendar_events ?? [];
  const reminders = today.active_reminders ?? [];
  const notes = notesPayload?.notes ?? [];
  const conversations = conversationsPayload?.conversations ?? [];
  const connectorsList = connectorsPayload?.connectors ?? [];
  const displayName = String(state.user.display_name || "there").split(" ")[0];
  shell(`
    <section class="dashboard">
      <div class="dashboard-main">
        <section class="hero-panel">
          <div>
            <h1>Good morning, ${escapeHtml(displayName)}.</h1>
            <p>Let's make today amazing.</p>
          </div>
        </section>
        <section class="metric-grid">
          ${metricCard("Tasks Due", tasks.length, `${today.due_today_tasks?.length ?? 0} today`, "success")}
          ${metricCard("Events Today", events.length, nextEventLabel(events), "info")}
          ${metricCard("Reminders", reminders.length, `${today.overdue_tasks?.length ?? 0} overdue`, "warning")}
          ${metricCard("Automations", operationsPayload?.components?.scheduler === "healthy" ? 2 : 0, operationsPayload?.components?.scheduler ?? "unknown", "success")}
        </section>
        <section class="dashboard-grid">
          ${panel("Today's Schedule", "View Calendar", "/calendar", scheduleList(events))}
          ${panel("Priority Tasks", "View All", "/tasks", priorityTaskList(tasks))}
          ${panel("Recent Notes", "View All", "/notes", recentNotesList(notes))}
          ${panel("Assistant Suggestions", "", "", suggestionList(today))}
        </section>
      </div>
      <aside class="dashboard-rail" aria-label="Dashboard context">
        ${conversationPanel(conversations)}
        ${integrationsPanel(connectorsList)}
        ${quickActionsPanel()}
        ${systemStatusPanel(operationsPayload)}
      </aside>
    </section>
  `, { wide: true });
}

async function renderAssistant() {
  const [conversationsPayload, settingsPayload] = await Promise.all([
    safeFetch("/api/v1/conversations"),
    safeFetch("/api/v1/assistant/settings"),
  ]);
  const conversations = conversationsPayload?.conversations ?? [];
  const settings = settingsPayload?.settings ?? {};
  shell(`
    <section class="page-header">
      <p class="eyebrow">Advisory assistant</p>
      <h1>Assistant</h1>
      <p>Persistent read-only conversations through the local AI gateway. Phase 6 cannot modify tasks, notes, calendars, reminders, or settings.</p>
    </section>
    <div class="tabs">
      ${navLink("/assistant", "Chat")}
      ${navLink("/assistant/plans", "Plans")}
      ${navLink("/assistant/actions", "Actions")}
      ${navLink("/conversations", "Conversations")}
      ${navLink("/assistant/settings", "AI Settings")}
    </div>
    <section class="grid">
      <article><h2>Provider</h2><p>${escapeHtml(settings.provider ?? "mock")}</p></article>
      <article><h2>Model</h2><p>${escapeHtml(settings.model ?? "mock-deterministic-v1")}</p></article>
      <article><h2>Mode</h2><p>Read-only</p></article>
      ${summaryCard("Conversations", conversations)}
    </section>
    <form id="assistant-form" class="form">
      <label>Message <textarea name="message" rows="6" required></textarea></label>
      <label>Conversation
        <select name="conversation_id">
          <option value="">New conversation</option>
          ${conversations.map((conversation) => `<option value="${conversation.id}">${escapeHtml(conversation.title)}</option>`).join("")}
        </select>
      </label>
      <label class="check"><input name="stream" type="checkbox" checked /> Stream response chunks</label>
      <button type="submit">Send</button>
    </form>
    <form id="planner-form" class="form">
      <label>Plan a request <textarea name="message" rows="4" required></textarea></label>
      <button type="submit">Understand and plan</button>
    </form>
    <section class="list" id="assistant-result"></section>
    <section class="list" id="planner-result"></section>
    <section class="list">
      <h2>Recent Conversations</h2>
      ${conversations.map(conversationCard).join("") || "<p>No conversations yet.</p>"}
    </section>
  `);
  document.querySelector("#assistant-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = formBody(event.target);
    const endpoint = event.target.elements.stream.checked ? "/api/v1/assistant/stream" : "/api/v1/assistant/chat";
    await submit(async () => {
      const payload = await fetchJson(endpoint, { method: "POST", body, timeoutMs: 10000 });
      renderAssistantResult(payload);
    }, async () => {});
  });
  document.querySelector("#planner-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    await submit(async () => {
      const payload = await fetchJson("/api/v1/assistant/request", { method: "POST", body: formBody(event.target), timeoutMs: 10000 });
      renderPlannerResult(payload);
    }, async () => {});
  });
}

async function renderMemory() {
  const [memoriesPayload, proposalsPayload, preferencesPayload, privacyPayload, outcomesPayload, routinesPayload] = await Promise.all([
    safeFetch("/api/v1/memories?include_archived=true"),
    safeFetch("/api/v1/memory/proposals"),
    safeFetch("/api/v1/preferences"),
    safeFetch("/api/v1/memory/privacy"),
    safeFetch("/api/v1/outcomes"),
    safeFetch("/api/v1/routines"),
  ]);
  const memories = memoriesPayload?.memories ?? [];
  const proposals = proposalsPayload?.proposals ?? [];
  const preferences = preferencesPayload?.preferences ?? { explicit: {}, learned: {}, effective: {} };
  const privacy = privacyPayload?.privacy ?? { memory_enabled: true, personalization_enabled: true, disabled_categories: [] };
  shell(`
    <section class="page-header">
      <p class="eyebrow">User-owned continuity</p>
      <h1>Memory</h1>
      <p>Inspect, edit, archive, restore, delete, retrieve, and export durable memories. Nothing is remembered automatically.</p>
    </section>
    <div class="tabs">${navLink("/memory", "Memories")}${navLink("/preferences", "Preferences")}</div>
    <section class="grid">
      ${summaryCard("Active", memories.filter((memory) => memory.status === "ACTIVE"))}
      ${summaryCard("Archived", memories.filter((memory) => memory.status === "ARCHIVED"))}
      ${summaryCard("Expired", memories.filter((memory) => memory.status === "EXPIRED"))}
      ${summaryCard("Corrections", memories.filter((memory) => memory.category === "Correction"))}
    </section>
    <form id="memory-form" class="form">
      <label>Category
        <select name="category">${["Preference", "Routine", "Commitment", "Reference", "Interaction", "Outcome", "Correction"].map((item) => `<option value="${item}">${item}</option>`).join("")}</select>
      </label>
      <label>Sensitivity
        <select name="sensitivity">${["GENERAL", "PERSONAL", "SENSITIVE"].map((item) => `<option value="${item}">${item}</option>`).join("")}</select>
      </label>
      <label>Title <input name="title" value="Preferred planning style" required /></label>
      <label>Content <textarea name="content" rows="4" required>I prefer concise daily plans grouped by priority.</textarea></label>
      <label>Valid until <input name="valid_until" placeholder="optional ISO date" /></label>
      <label>Confirmation <input name="confirmation_text" placeholder="REMEMBER for sensitive memories" /></label>
      <button type="submit">Remember</button>
    </form>
    <form id="memory-proposal-form" class="form">
      <label>Proposal title <input name="title" value="Weekly review routine" required /></label>
      <label>Category
        <select name="category">${["Preference", "Routine", "Commitment", "Reference", "Interaction", "Outcome", "Correction"].map((item) => `<option value="${item}">${item}</option>`).join("")}</select>
      </label>
      <label>Content <textarea name="content" rows="3" required>Review open tasks every Friday afternoon.</textarea></label>
      <label>Reason <input name="reason" value="Suggested routine from repeated planning behavior." required /></label>
      <button type="submit">Propose memory</button>
    </form>
    <form id="memory-retrieve-form" class="form inline-form">
      <label>Retrieve for <input name="query" value="planning style weekly routine" required /></label>
      <button type="submit">Retrieve relevant memory</button>
    </form>
    <section class="list" id="memory-context"></section>
    <section class="list">
      <h2>Memory Proposals</h2>
      ${proposals.map(memoryProposalCard).join("") || "<p>No memory proposals.</p>"}
    </section>
    <section class="list">
      <h2>Memories</h2>
      ${memories.map(memoryCard).join("") || "<p>No memories yet.</p>"}
    </section>
    <form id="preference-form" class="form inline-form">
      <label>Preference key <input name="key" value="writing_style" required /></label>
      <label>Value <input name="value" value="concise" required /></label>
      <input name="source" type="hidden" value="EXPLICIT" />
      <button type="submit">Save preference</button>
    </form>
    <section class="list">
      <h2>Effective Preferences</h2>
      ${Object.entries(preferences.effective ?? {}).map(([key, value]) => `<article><h2>${escapeHtml(key)}</h2><p>${escapeHtml(value)}</p></article>`).join("") || "<p>No preferences.</p>"}
    </section>
    <form id="privacy-form" class="form">
      <label class="check"><input name="memory_enabled" type="checkbox" ${privacy.memory_enabled ? "checked" : ""} /> Memory enabled</label>
      <label class="check"><input name="personalization_enabled" type="checkbox" ${privacy.personalization_enabled ? "checked" : ""} /> Personalization enabled</label>
      <label>Disabled categories <input name="disabled_categories" value="${escapeHtml((privacy.disabled_categories ?? []).join(", "))}" /></label>
      <button type="submit">Save privacy controls</button>
    </form>
    <form id="outcome-form" class="form">
      <label>Recommendation <input name="recommendation" value="Use a weekly review" required /></label>
      <label>Satisfaction <input name="satisfaction" type="number" min="0" max="5" value="4" /></label>
      <label class="check"><input name="accepted" type="checkbox" checked /> Accepted</label>
      <label class="check"><input name="completed" type="checkbox" /> Completed</label>
      <button type="submit">Record outcome</button>
    </form>
    <section class="list">
      <h2>Outcomes and Routines</h2>
      ${(outcomesPayload?.outcomes ?? []).map(outcomeCard).join("") || "<p>No outcomes yet.</p>"}
      ${(routinesPayload?.routines ?? []).map(routineCard).join("") || ""}
    </section>
    <section class="actions">
      <button id="export-memory" type="button">Export memory</button>
      <button id="clear-memory" type="button">Clear memory</button>
    </section>
    <pre class="json" id="memory-export"></pre>
  `);
  document.querySelector("#memory-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    await submit(() => fetchJson("/api/v1/memories", { method: "POST", body: formBody(event.target) }), renderMemory);
  });
  document.querySelector("#memory-proposal-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    await submit(() => fetchJson("/api/v1/memory/proposals", { method: "POST", body: formBody(event.target) }), renderMemory);
  });
  document.querySelector("#memory-retrieve-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = await fetchJson("/api/v1/memories/retrieve", { method: "POST", body: formBody(event.target) });
    document.querySelector("#memory-context").innerHTML = `<h2>Retrieved Memory</h2>${(payload.memory_context?.memories ?? []).map(memoryCard).join("") || "<p>No relevant memory.</p>"}<p>${escapeHtml(payload.memory_context?.retrieval_reason ?? "")}</p>`;
    bindMemoryButtons();
  });
  document.querySelector("#preference-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    await submit(() => fetchJson("/api/v1/preferences", { method: "POST", body: formBody(event.target) }), renderMemory);
  });
  document.querySelector("#privacy-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = formBody(event.target);
    body.memory_enabled = event.target.elements.memory_enabled.checked;
    body.personalization_enabled = event.target.elements.personalization_enabled.checked;
    body.disabled_categories = (body.disabled_categories ?? "").split(",").map((item) => item.trim()).filter(Boolean);
    await submit(() => fetchJson("/api/v1/memory/privacy", { method: "POST", body }), renderMemory);
  });
  document.querySelector("#outcome-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = formBody(event.target);
    body.accepted = event.target.elements.accepted.checked;
    body.completed = event.target.elements.completed.checked;
    await submit(() => fetchJson("/api/v1/outcomes", { method: "POST", body }), renderMemory);
  });
  document.querySelector("#export-memory").addEventListener("click", async () => {
    const exported = await fetchJson("/api/v1/memory/export");
    document.querySelector("#memory-export").textContent = JSON.stringify(exported.memory_export, null, 2);
  });
  document.querySelector("#clear-memory").addEventListener("click", async () => {
    await submit(() => fetchJson("/api/v1/memories/clear", { method: "POST", body: {} }), renderMemory);
  });
  bindMemoryButtons();
}

async function renderAutomation() {
  const [automationsPayload, templatesPayload, executionsPayload, jobsPayload] = await Promise.all([
    safeFetch("/api/v1/automations"),
    safeFetch("/api/v1/automation-templates"),
    safeFetch("/api/v1/automation-executions"),
    safeFetch("/api/v1/scheduler/jobs"),
  ]);
  const automations = automationsPayload?.automations ?? [];
  const templates = templatesPayload?.templates ?? [];
  const executions = executionsPayload?.executions ?? [];
  const jobs = jobsPayload?.jobs ?? [];
  shell(`
    <section class="page-header">
      <p class="eyebrow">Bounded autonomy</p>
      <h1>Automation</h1>
      <p>Create approved routines, inspect upcoming runs, run workflows on demand, and pause or archive anything at any time.</p>
    </section>
    <section class="grid">
      ${summaryCard("Active", automations.filter((item) => item.status === "ACTIVE"))}
      ${summaryCard("Paused", automations.filter((item) => item.status === "PAUSED"))}
      ${summaryCard("Upcoming", jobs.filter((item) => item.status === "SCHEDULED"))}
      ${summaryCard("Failures", executions.filter((item) => item.status === "FAILED"))}
    </section>
    <form id="automation-template-form" class="form inline-form">
      <label>Template
        <select name="template_id">
          ${templates.map((template) => `<option value="${template.id}">${escapeHtml(template.name)}</option>`).join("")}
        </select>
      </label>
      <button type="submit">Create from template</button>
    </form>
    <form id="automation-form" class="form">
      <label>Name <input name="name" value="Daily task check" required /></label>
      <label>Description <input name="description" value="Read today and record a dashboard notification." /></label>
      <label>Schedule
        <select name="schedule">${["Hourly", "Daily", "Weekly", "Monthly", "Yearly"].map((item) => `<option value="${item}">${item}</option>`).join("")}</select>
      </label>
      <label>Time <input name="time" value="09:00" /></label>
      <label>Step JSON <textarea name="steps" rows="7">[{"step_type":"READ","name":"Collect today summary","configuration":{"source":"today"}},{"step_type":"NOTIFY","name":"Record completion","configuration":{"message":"Daily task check completed."}}]</textarea></label>
      <button type="submit">Create automation</button>
    </form>
    <section class="actions">
      <button id="run-due-automations" type="button">Run due automations</button>
    </section>
    <section class="list">
      <h2>Automations</h2>
      ${automations.map(automationCard).join("") || "<p>No automations yet.</p>"}
    </section>
    <section class="list">
      <h2>Upcoming Runs</h2>
      ${jobs.map(schedulerJobCard).join("") || "<p>No scheduled jobs.</p>"}
    </section>
    <section class="list">
      <h2>Execution History</h2>
      ${executions.map(automationExecutionCard).join("") || "<p>No automation executions yet.</p>"}
    </section>
  `);
  document.querySelector("#automation-template-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    await submit(() => fetchJson("/api/v1/automations", { method: "POST", body: formBody(event.target) }), renderAutomation);
  });
  document.querySelector("#automation-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = formBody(event.target);
    try {
      body.steps = JSON.parse(body.steps || "[]");
    } catch {
      state.error = "Step JSON must be valid.";
      await renderAutomation();
      return;
    }
    body.automation_type = "ROUTINE";
    body.authority_level = "LOW";
    body.trigger = { type: "TIME", schedule: body.schedule, time: body.time };
    await submit(() => fetchJson("/api/v1/automations", { method: "POST", body }), renderAutomation);
  });
  document.querySelector("#run-due-automations").addEventListener("click", async () => {
    await submit(() => fetchJson("/api/v1/automations/run-due", { method: "POST", body: {} }), renderAutomation);
  });
  bindAutomationButtons();
}

async function renderConnectors() {
  const [registryPayload, connectorsPayload, syncPayload, conflictsPayload, recordsPayload] = await Promise.all([
    safeFetch("/api/v1/connector-registry"),
    safeFetch("/api/v1/connectors"),
    safeFetch("/api/v1/synchronizations"),
    safeFetch("/api/v1/synchronization-conflicts"),
    safeFetch("/api/v1/external-records"),
  ]);
  const registry = registryPayload?.registry ?? [];
  const connected = connectorsPayload?.connectors ?? [];
  const synchronizations = syncPayload?.synchronizations ?? [];
  const conflicts = conflictsPayload?.conflicts ?? [];
  const records = recordsPayload?.records ?? [];
  shell(`
    <section class="page-header">
      <p class="eyebrow">Optional external extensions</p>
      <h1>Connectors</h1>
      <p>Connect, authorize, synchronize, monitor, and disconnect replaceable providers without making local data dependent on them.</p>
    </section>
    <section class="grid">
      ${summaryCard("Connected", connected.filter((item) => item.status === "CONNECTED"))}
      ${summaryCard("Needs attention", connected.filter((item) => ["DEGRADED", "ERROR"].includes(item.status)))}
      ${summaryCard("Synchronizations", synchronizations)}
      ${summaryCard("Conflicts", conflicts.filter((item) => item.status === "OPEN"))}
    </section>
    <form id="connector-form" class="form inline-form">
      <label>Provider
        <select name="registry_id">
          ${registry.map((item) => `<option value="${item.id}">${escapeHtml(item.display_name)}</option>`).join("")}
        </select>
      </label>
      <button type="submit">Create connector</button>
    </form>
    <section class="list">
      <h2>Available Connectors</h2>
      ${registry.map(connectorRegistryCard).join("") || "<p>No connector providers are available.</p>"}
    </section>
    <section class="list">
      <h2>Connected Services</h2>
      ${connected.map(connectorCard).join("") || "<p>No connectors configured.</p>"}
    </section>
    <section class="list">
      <h2>Synchronization History</h2>
      ${synchronizations.map(syncCard).join("") || "<p>No synchronizations yet.</p>"}
    </section>
    <section class="list">
      <h2>Conflicts</h2>
      ${conflicts.map(conflictSyncCard).join("") || "<p>No synchronization conflicts.</p>"}
    </section>
    <section class="list">
      <h2>Imported Metadata</h2>
      ${records.map(externalRecordCard).join("") || "<p>No imported external metadata.</p>"}
    </section>
    <section class="actions">
      <button id="export-connectors" type="button">Export connector data</button>
    </section>
    <pre class="json" id="connector-export"></pre>
  `);
  document.querySelector("#connector-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const registryItem = registry.find((item) => item.id === formBody(event.target).registry_id);
    await submit(() => fetchJson("/api/v1/connectors", {
      method: "POST",
      body: {
        provider: registryItem.provider,
        connector_type: registryItem.connector_type,
        requested_scopes: registryItem.supported_permissions.filter((scope) => scope !== "DELETE"),
        synchronization_mode: registryItem.synchronization_modes[0],
      },
    }), renderConnectors);
  });
  document.querySelector("#export-connectors").addEventListener("click", async () => {
    const exported = await fetchJson("/api/v1/connectors/export");
    document.querySelector("#connector-export").textContent = JSON.stringify(exported.connector_export, null, 2);
  });
  bindConnectorButtons();
}

async function renderOperations() {
  const [healthPayload, diagnosticsPayload, backupsPayload, restoresPayload, checksPayload, releasesPayload] = await Promise.all([
    safeFetch("/api/v1/system/health"),
    safeFetch("/api/v1/system/diagnostics"),
    safeFetch("/api/v1/system/backups"),
    safeFetch("/api/v1/system/restores"),
    safeFetch("/api/v1/system/checks"),
    safeFetch("/api/v1/system/releases"),
  ]);
  const backups = backupsPayload?.backups ?? [];
  const restores = restoresPayload?.restores ?? [];
  const checks = checksPayload?.checks ?? [];
  const releases = releasesPayload?.releases ?? [];
  const diagnostics = diagnosticsPayload?.diagnostics;
  shell(`
    <section class="page-header">
      <p class="eyebrow">Production qualification</p>
      <h1>Operations</h1>
      <p>Run readiness and security checks, create verified backups, rehearse recovery, inspect diagnostics, and record release evidence.</p>
    </section>
    <section class="grid">
      <article><h2>System Health</h2><p>${escapeHtml(healthPayload?.status ?? "unknown")}</p></article>
      ${summaryCard("Backups", backups)}
      ${summaryCard("Restore Runs", restores)}
      ${summaryCard("Releases", releases)}
    </section>
    <section class="actions">
      <button id="run-readiness" type="button">Run readiness checks</button>
      <button id="run-security" type="button">Run security checks</button>
      <button id="create-backup" type="button">Create backup</button>
      <button id="qualify-release" type="button">Qualify release</button>
    </section>
    <section class="list">
      <h2>Backups</h2>
      ${backups.map(backupCard).join("") || "<p>No backups yet.</p>"}
    </section>
    <section class="list">
      <h2>Restore History</h2>
      ${restores.map(restoreCard).join("") || "<p>No restore rehearsals yet.</p>"}
    </section>
    <section class="list">
      <h2>Operational Checks</h2>
      ${checks.map(checkCard).join("") || "<p>No operational checks have been run.</p>"}
    </section>
    <section class="list">
      <h2>Release History</h2>
      ${releases.map(releaseCard).join("") || "<p>No release qualifications yet.</p>"}
    </section>
    <section class="list">
      <h2>Diagnostics</h2>
      <pre class="json">${escapeHtml(JSON.stringify(diagnostics ?? {}, null, 2))}</pre>
    </section>
  `);
  document.querySelector("#run-readiness").addEventListener("click", async () => {
    await submit(() => fetchJson("/api/v1/system/checks/readiness", { method: "POST", body: {} }), renderOperations);
  });
  document.querySelector("#run-security").addEventListener("click", async () => {
    await submit(() => fetchJson("/api/v1/system/checks/security", { method: "POST", body: {} }), renderOperations);
  });
  document.querySelector("#create-backup").addEventListener("click", async () => {
    await submit(() => fetchJson("/api/v1/system/backup", { method: "POST", body: { backup_type: "MANUAL" }, timeoutMs: 10000 }), renderOperations);
  });
  document.querySelector("#qualify-release").addEventListener("click", async () => {
    await submit(() => fetchJson("/api/v1/system/release/qualify", { method: "POST", body: { tests_passed: true }, timeoutMs: 10000 }), renderOperations);
  });
  bindOperationButtons();
}

function renderAssistantResult(payload) {
  const result = document.querySelector("#assistant-result");
  const chunks = payload.stream?.chunks ?? [payload.assistant_message?.content ?? ""];
  result.innerHTML = `
    <article>
      <h2>Assistant Response</h2>
      <p>${escapeHtml(payload.assistant_message?.provider ?? "mock")} · ${escapeHtml(payload.assistant_message?.model ?? "")} · ${escapeHtml(payload.assistant_message?.prompt_version ?? "")}</p>
      <div class="stream-output">${chunks.map((chunk) => `<span>${escapeHtml(chunk)}</span>`).join("")}</div>
      <p><a href="/conversations/${payload.conversation.id}" data-link>Open conversation</a></p>
    </article>
  `;
  bindLinks();
}

function renderPlannerResult(payload) {
  const result = document.querySelector("#planner-result");
  result.innerHTML = `
    <article>
      <h2>Planning Result</h2>
      <p>${escapeHtml(payload.intent.category)} · confidence ${Number(payload.intent.confidence).toFixed(2)} · proposal-ready</p>
      <p>${escapeHtml(payload.answer.answer)}</p>
      <p><a href="/assistant/plans?plan=${payload.plan.id}" data-link>Open plan</a></p>
    </article>
  `;
  bindLinks();
}

async function renderAssistantPlans() {
  const params = new URLSearchParams(window.location.search);
  const planId = params.get("plan");
  const [toolsPayload, metricsPayload, planPayload] = await Promise.all([
    safeFetch("/api/v1/tools"),
    safeFetch("/api/v1/metrics/planning"),
    planId ? safeFetch(`/api/v1/plans/${planId}`) : Promise.resolve(null),
  ]);
  const plan = planPayload?.plan;
  shell(`
    <section class="page-header"><h1>Plans</h1><p>Inspect intent recognition, selected context, tool choices, and planning metrics before creating proposals.</p></section>
    <div class="tabs">${assistantTabs()}</div>
    <form id="planner-page-form" class="form">
      <label>Request <textarea name="message" rows="4" required></textarea></label>
      <button type="submit">Create plan</button>
    </form>
    <section class="list">
      ${plan ? planDetailCard(plan) : "<p>Select or create a plan to inspect details.</p>"}
    </section>
    <section class="list">
      <h2>Registered Tools</h2>
      ${(toolsPayload?.tools ?? []).map(toolCard).join("") || "<p>No tools registered.</p>"}
    </section>
    <section class="list">
      <h2>Planning Metrics</h2>
      ${(metricsPayload?.metrics ?? []).map(planningMetricCard).join("") || "<p>No planning metrics yet.</p>"}
    </section>
  `);
  document.querySelector("#planner-page-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    await submit(async () => {
      const payload = await fetchJson("/api/v1/assistant/request", { method: "POST", body: formBody(event.target), timeoutMs: 10000 });
      navigate(`/assistant/plans?plan=${payload.plan.id}`);
    }, async () => {});
  });
}

async function renderAssistantActions() {
  const [proposalsPayload, executionsPayload, toolsPayload, metricsPayload] = await Promise.all([
    safeFetch("/api/v1/proposals"),
    safeFetch("/api/v1/executions"),
    safeFetch("/api/v1/tools"),
    safeFetch("/api/v1/metrics/execution"),
  ]);
  const tools = (toolsPayload?.tools ?? []).filter((tool) => !tool.read_only);
  const proposals = proposalsPayload?.proposals ?? [];
  const executions = executionsPayload?.executions ?? [];
  shell(`
    <section class="page-header">
      <p class="eyebrow">Controlled execution</p>
      <h1>Actions</h1>
      <p>Review proposed changes, explicitly approve them, execute through the action gateway, and inspect verification or rollback history.</p>
    </section>
    <div class="tabs">${assistantTabs()}</div>
    <section class="grid">
      ${summaryCard("Proposals", proposals)}
      ${summaryCard("Executions", executions)}
      ${summaryCard("Write tools", tools)}
      ${summaryCard("Execution metrics", metricsPayload?.metrics ?? [])}
    </section>
    <form id="proposal-form" class="form">
      <label>Tool
        <select name="tool_name">
          ${tools.map((tool) => `<option value="${tool.name}">${escapeHtml(tool.name)}</option>`).join("")}
        </select>
      </label>
      <label>Title <input name="title" value="Create action proposal" required /></label>
      <label>Summary <textarea name="summary" rows="3">Review and approve this controlled action before execution.</textarea></label>
      <label>Input JSON <textarea name="input_payload" rows="7">{"title":"New task"}</textarea></label>
      <button type="submit">Create proposal</button>
    </form>
    <form id="assistant-proposal-form" class="form">
      <label>Assistant request <textarea name="message" rows="4" required>Create task Renew passport</textarea></label>
      <button type="submit">Generate proposal</button>
    </form>
    <section class="list">
      <h2>Proposal Review</h2>
      ${proposals.map(actionProposalCard).join("") || "<p>No action proposals yet.</p>"}
    </section>
    <section class="list">
      <h2>Execution History</h2>
      ${executions.map(executionCard).join("") || "<p>No executions yet.</p>"}
    </section>
  `);
  document.querySelector("#proposal-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = formBody(event.target);
    try {
      body.input_payload = JSON.parse(body.input_payload || "{}");
    } catch {
      state.error = "Input JSON must be valid.";
      await renderAssistantActions();
      return;
    }
    await submit(() => fetchJson("/api/v1/proposals", { method: "POST", body }), renderAssistantActions);
  });
  document.querySelector("#assistant-proposal-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    await submit(() => fetchJson("/api/v1/assistant/propose", { method: "POST", body: formBody(event.target) }), renderAssistantActions);
  });
  bindActionButtons();
}

async function renderConversations() {
  const params = new URLSearchParams(window.location.search);
  const query = params.get("q") ?? "";
  const payload = query ? await safeFetch(`/api/v1/conversations/search?q=${encodeURIComponent(query)}&include_archived=true`) : await safeFetch("/api/v1/conversations");
  const conversations = query ? payload?.conversations ?? [] : payload?.conversations ?? [];
  shell(`
    <section class="page-header"><h1>Conversations</h1><p>Search, continue, archive, and export persistent assistant conversations.</p></section>
    <div class="tabs">${assistantTabs()}</div>
    <form id="conversation-search-form" class="form inline-form">
      <label>Search <input name="q" value="${escapeHtml(query)}" /></label>
      <button type="submit">Search</button>
    </form>
    <form id="conversation-form" class="form inline-form">
      <label>Title <input name="title" value="New conversation" required /></label>
      <button type="submit">Create</button>
    </form>
    <section class="list">${conversations.map(conversationCard).join("") || "<p>No conversations.</p>"}</section>
  `);
  document.querySelector("#conversation-search-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const body = formBody(event.target);
    navigate(`/conversations?q=${encodeURIComponent(body.q ?? "")}`);
  });
  document.querySelector("#conversation-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    await submit(() => fetchJson("/api/v1/conversations", { method: "POST", body: formBody(event.target) }), renderConversations);
  });
  bindConversationButtons(renderConversations);
}

async function renderConversationDetail() {
  const conversationId = window.location.pathname.split("/").pop();
  const payload = await safeFetch(`/api/v1/conversations/${conversationId}`);
  const conversation = payload?.conversation;
  if (!conversation) {
    renderNotFound();
    return;
  }
  shell(`
    <section class="page-header">
      <p class="eyebrow">Conversation</p>
      <h1>${escapeHtml(conversation.title)}</h1>
      <p>${escapeHtml(conversation.status)} · ${conversation.messages.length} messages · ${escapeHtml(conversation.updated_at)}</p>
    </section>
    <div class="tabs">${assistantTabs()}</div>
    <form id="rename-conversation-form" class="form inline-form">
      <label>Title <input name="title" value="${escapeHtml(conversation.title)}" required /></label>
      <button type="submit">Rename</button>
    </form>
    <section class="list conversation-history">
      ${conversation.messages.map(messageCard).join("") || "<p>No messages yet.</p>"}
    </section>
    <form id="continue-conversation-form" class="form">
      <label>Continue <textarea name="message" rows="5" required></textarea></label>
      <input name="conversation_id" type="hidden" value="${conversation.id}" />
      <button type="submit">Send</button>
    </form>
    <section class="actions">
      <button data-conversation="${conversation.id}" data-action="retry" type="button">Retry</button>
      <button data-conversation="${conversation.id}" data-action="archive" type="button">Archive</button>
      <button id="export-conversation" type="button">Export</button>
    </section>
    <pre class="json" id="conversation-export"></pre>
  `);
  document.querySelector("#rename-conversation-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    await submit(() => fetchJson(`/api/v1/conversations/${conversation.id}`, { method: "PATCH", body: formBody(event.target) }), renderConversationDetail);
  });
  document.querySelector("#continue-conversation-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    await submit(() => fetchJson("/api/v1/assistant/stream", { method: "POST", body: formBody(event.target), timeoutMs: 10000 }), renderConversationDetail);
  });
  document.querySelector("#export-conversation").addEventListener("click", async () => {
    const exported = await safeFetch(`/api/v1/conversations/${conversation.id}/export`);
    document.querySelector("#conversation-export").textContent = exported?.markdown ?? "";
  });
  bindConversationButtons(renderConversationDetail);
}

async function renderAssistantSettings() {
  const [settingsPayload, promptsPayload, usagePayload, healthPayload] = await Promise.all([
    safeFetch("/api/v1/assistant/settings"),
    safeFetch("/api/v1/prompts"),
    safeFetch("/api/v1/usage"),
    safeFetch("/api/v1/assistant/provider-health"),
  ]);
  const settings = settingsPayload?.settings ?? {};
  shell(`
    <section class="page-header"><h1>AI Settings</h1><p>Provider routing, prompt inspection, usage metrics, and adapter health.</p></section>
    <div class="tabs">${assistantTabs()}</div>
    <form id="ai-settings-form" class="form split">
      <label>Provider
        <select name="provider">
          ${["mock", "hosted", "local"].map((provider) => `<option value="${provider}" ${settings.provider === provider ? "selected" : ""}>${provider}</option>`).join("")}
        </select>
      </label>
      <label>Model <input name="model" value="${escapeHtml(settings.model ?? "mock-deterministic-v1")}" required /></label>
      <label>Temperature <input name="temperature" type="number" min="0" max="2" step="0.1" value="${escapeHtml(settings.temperature ?? 0)}" /></label>
      <label>Max tokens <input name="max_tokens" type="number" min="1" max="8192" value="${escapeHtml(settings.max_tokens ?? 512)}" /></label>
      <label>Timeout seconds <input name="timeout_seconds" type="number" min="1" max="300" value="${escapeHtml(settings.timeout_seconds ?? 30)}" /></label>
      <button type="submit">Save AI settings</button>
    </form>
    <section class="list">
      <h2>Prompts</h2>
      ${(promptsPayload?.prompts ?? []).map(promptCard).join("") || "<p>No prompts.</p>"}
    </section>
    <section class="list">
      <h2>Provider Health</h2>
      ${(healthPayload?.provider_health ?? []).map(healthCard).join("") || "<p>No provider checks.</p>"}
    </section>
    <section class="list">
      <h2>Usage</h2>
      ${(usagePayload?.usage ?? []).map(usageCard).join("") || "<p>No usage yet.</p>"}
    </section>
  `);
  document.querySelector("#ai-settings-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = formBody(event.target);
    body.temperature = Number(body.temperature);
    body.max_tokens = Number(body.max_tokens);
    body.timeout_seconds = Number(body.timeout_seconds);
    await submit(() => fetchJson("/api/v1/assistant/settings", { method: "POST", body }), renderAssistantSettings);
  });
}

async function renderNotes() {
  const [notesPayload, notebooksPayload, tagsPayload] = await Promise.all([
    safeFetch("/api/v1/notes"),
    safeFetch("/api/v1/notebooks"),
    safeFetch("/api/v1/tags"),
  ]);
  const notes = notesPayload?.notes ?? [];
  const notebooks = notebooksPayload?.notebooks ?? [];
  const tags = tagsPayload?.tags ?? [];
  const draft = localStorage.getItem("d2d-note-draft") ?? "";
  shell(`
    <section class="page-header">
      <p class="eyebrow">Knowledge</p>
      <h1>Notes</h1>
      <p>Capture Markdown notes, organize notebooks, link records, attach files, and search locally.</p>
    </section>
    <div class="tabs">
      ${navLink("/notes", "All Notes")}
      ${navLink("/notebooks", "Notebooks")}
      ${navLink("/search", "Search")}
      ${navLink("/attachments", "Attachments")}
    </div>
    <form id="search-form" class="form inline-form">
      <label>Search <input name="q" /></label>
      <button type="submit">Search</button>
    </form>
    <form id="notebook-form" class="form split">
      <label>Notebook name <input name="name" required /></label>
      <label>Color <input name="color_key" value="blue" /></label>
      <label>Description <input name="description" /></label>
      <label>Position <input name="position" type="number" value="0" /></label>
      <button type="submit">Create notebook</button>
    </form>
    <form id="note-form" class="form note-editor">
      <label>Title <input name="title" required /></label>
      <label>Notebook
        <select name="notebook_id">${notebooks.map((notebook) => `<option value="${notebook.id}">${escapeHtml(notebook.name)}</option>`).join("")}</select>
      </label>
      <label>Tags <input name="tags" placeholder="weekly, planning" /></label>
      <label class="check"><input name="is_favorite" type="checkbox" /> Favorite</label>
      <label class="wide">Markdown <textarea id="new-note-markdown" name="content_markdown" rows="12">${escapeHtml(draft)}</textarea></label>
      <article class="wide preview" id="new-note-preview">${markdownPreview(draft)}</article>
      <button type="submit">Create note</button>
    </form>
    <section class="grid">
      ${summaryCard("Notes", notes)}
      ${summaryCard("Notebooks", notebooks)}
      ${summaryCard("Tags", tags)}
      ${summaryCard("Favorites", notes.filter((note) => note.is_favorite))}
    </section>
    <section class="list">
      <h2>Notebooks</h2>
      ${notebooks.map(notebookCard).join("") || "<p>No notebooks yet.</p>"}
    </section>
    <section class="list">
      <h2>Notes</h2>
      ${notes.map(noteCard).join("") || "<p>No notes yet.</p>"}
    </section>
  `);
  bindMarkdownPreview("#new-note-markdown", "#new-note-preview", "d2d-note-draft");
  document.querySelector("#search-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const body = formBody(event.target);
    navigate(`/search?q=${encodeURIComponent(body.q ?? "")}`);
  });
  document.querySelector("#notebook-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    await submit(() => fetchJson("/api/v1/notebooks", { method: "POST", body: formBody(event.target) }), renderNotes);
  });
  document.querySelector("#note-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = formBody(event.target);
    body.tags = splitTags(body.tags);
    body.is_favorite = Boolean(event.target.elements.is_favorite.checked);
    await submit(() => fetchJson("/api/v1/notes", { method: "POST", body }), async () => {
      localStorage.removeItem("d2d-note-draft");
      await renderNotes();
    });
  });
  bindNotebookButtons();
  bindNoteButtons(renderNotes);
}

async function renderNoteEditor() {
  const noteId = window.location.pathname.split("/").pop();
  const [notePayload, notebooksPayload, versionsPayload] = await Promise.all([
    safeFetch(`/api/v1/notes/${noteId}`),
    safeFetch("/api/v1/notebooks"),
    safeFetch(`/api/v1/notes/${noteId}/versions`),
  ]);
  const note = notePayload?.note;
  if (!note) {
    renderNotFound();
    return;
  }
  const notebooks = notebooksPayload?.notebooks ?? [];
  const versions = versionsPayload?.versions ?? [];
  const draftKey = `d2d-note-draft-${note.id}`;
  const draft = localStorage.getItem(draftKey);
  const content = draft ?? note.content_markdown;
  shell(`
    <section class="page-header">
      <p class="eyebrow">Note</p>
      <h1>${escapeHtml(note.title)}</h1>
      <p>${escapeHtml(note.status)} · version ${escapeHtml(note.version)} · ${escapeHtml(note.word_count)} words · ${escapeHtml(note.reading_time_minutes)} min read</p>
    </section>
    <div class="tabs">
      ${navLink("/notes", "All Notes")}
      ${navLink("/search", "Search")}
      ${navLink("/attachments", "Attachments")}
    </div>
    <form id="edit-note-form" class="form note-editor">
      <label>Title <input name="title" value="${escapeHtml(note.title)}" required /></label>
      <label>Notebook
        <select name="notebook_id">${notebooks.map((notebook) => `<option value="${notebook.id}" ${notebook.id === note.notebook_id ? "selected" : ""}>${escapeHtml(notebook.name)}</option>`).join("")}</select>
      </label>
      <label>Tags <input name="tags" value="${escapeHtml((note.tags ?? []).join(", "))}" /></label>
      <label class="check"><input name="is_favorite" type="checkbox" ${note.is_favorite ? "checked" : ""} /> Favorite</label>
      <input name="version" type="hidden" value="${escapeHtml(note.version)}" />
      <label class="wide">Markdown <textarea id="edit-note-markdown" name="content_markdown" rows="16">${escapeHtml(content)}</textarea></label>
      <article class="wide preview" id="edit-note-preview">${markdownPreview(content)}</article>
      <button type="submit">Save note</button>
    </form>
    <form id="attachment-form" class="form split">
      <label>Filename <input name="filename" required /></label>
      <label>Media type <input name="media_type" value="text/plain" required /></label>
      <label class="wide">Text content <textarea name="content_text" rows="5"></textarea></label>
      <button type="submit">Add attachment</button>
    </form>
    <form id="link-form" class="form split">
      <label>Target type
        <select name="target_type"><option>NOTE</option><option>TASK</option><option>EVENT</option><option>FOLLOW_UP</option><option>REMINDER</option><option>PROJECT</option></select>
      </label>
      <label>Target ID <input name="target_id" required /></label>
      <label>Relationship
        <select name="relationship_type"><option>RELATED</option><option>REFERENCE</option><option>BACKGROUND</option><option>MEETING_NOTES</option><option>PREPARATION</option><option>OUTCOME</option></select>
      </label>
      <button type="submit">Create link</button>
    </form>
    <section class="list">
      <h2>Attachments</h2>
      ${(note.attachments ?? []).map(attachmentCard).join("") || "<p>No attachments.</p>"}
    </section>
    <section class="list">
      <h2>Linked Records</h2>
      ${(note.links?.outbound ?? []).map(linkCard).join("") || "<p>No outbound links.</p>"}
      <h2>Backlinks</h2>
      ${(note.links?.backlinks ?? []).map(linkCard).join("") || "<p>No backlinks.</p>"}
    </section>
    <section class="list">
      <h2>Version History</h2>
      ${versions.map(versionCard).join("") || "<p>No versions.</p>"}
    </section>
  `);
  bindMarkdownPreview("#edit-note-markdown", "#edit-note-preview", draftKey);
  document.querySelector("#edit-note-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = formBody(event.target);
    body.version = Number(body.version);
    body.tags = splitTags(body.tags);
    body.is_favorite = Boolean(event.target.elements.is_favorite.checked);
    await submit(() => fetchJson(`/api/v1/notes/${note.id}`, { method: "PATCH", body }), async () => {
      localStorage.removeItem(draftKey);
      await renderNoteEditor();
    });
  });
  document.querySelector("#attachment-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    await submit(() => fetchJson(`/api/v1/notes/${note.id}/attachments`, { method: "POST", body: formBody(event.target) }), renderNoteEditor);
  });
  document.querySelector("#link-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    await submit(() => fetchJson(`/api/v1/notes/${note.id}/links`, { method: "POST", body: formBody(event.target) }), renderNoteEditor);
  });
  document.querySelectorAll("[data-version]").forEach((button) => {
    button.addEventListener("click", async () => {
      await submit(() => fetchJson(`/api/v1/notes/${note.id}/restore-version`, { method: "POST", body: { version_number: Number(button.dataset.version) } }), renderNoteEditor);
    });
  });
  document.querySelectorAll("[data-attachment-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      await submit(() => fetchJson(`/api/v1/attachments/${button.dataset.attachmentDelete}`, { method: "DELETE" }), renderNoteEditor);
    });
  });
  bindNoteButtons(renderNoteEditor);
}

async function renderSearch() {
  const params = new URLSearchParams(window.location.search);
  const query = params.get("q") ?? "";
  const payload = query ? await safeFetch(`/api/v1/search?q=${encodeURIComponent(query)}`) : { results: [] };
  shell(`
    <section class="page-header"><h1>Search</h1><p>Deterministic local search across notes, notebooks, tags, and attachment names.</p></section>
    <div class="tabs">${navLink("/notes", "All Notes")}${navLink("/search", "Search")}${navLink("/attachments", "Attachments")}</div>
    <form id="search-page-form" class="form inline-form">
      <label>Query <input name="q" value="${escapeHtml(query)}" required /></label>
      <button type="submit">Search</button>
    </form>
    <section class="list">
      ${(payload?.results ?? []).map(searchResultCard).join("") || "<p>No search results.</p>"}
    </section>
  `);
  document.querySelector("#search-page-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const body = formBody(event.target);
    navigate(`/search?q=${encodeURIComponent(body.q)}`);
  });
}

async function renderAttachments() {
  const payload = await safeFetch("/api/v1/attachments");
  shell(`
    <section class="page-header"><h1>Attachments</h1><p>Local files attached to notes and included in local data backups.</p></section>
    <div class="tabs">${navLink("/notes", "All Notes")}${navLink("/search", "Search")}${navLink("/attachments", "Attachments")}</div>
    <section class="list">${(payload?.attachments ?? []).map(attachmentCard).join("") || "<p>No attachments.</p>"}</section>
  `);
}

async function renderCalendar() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const query = `start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`;
  const [eventsPayload, calendarsPayload, conflictsPayload, availabilityPayload] = await Promise.all([
    safeFetch(`/api/v1/calendar/agenda?${query}`),
    safeFetch("/api/v1/calendars"),
    safeFetch(`/api/v1/calendar/conflicts?${query}`),
    safePost("/api/v1/calendar/availability", { start: start.toISOString(), end: end.toISOString(), minimum_minutes: 30 }),
  ]);
  const events = eventsPayload?.events ?? [];
  const calendars = calendarsPayload?.calendars ?? [];
  const conflicts = conflictsPayload?.conflicts ?? [];
  const availability = availabilityPayload?.availability ?? {};
  shell(`
    <section class="page-header">
      <p class="eyebrow">Local calendar</p>
      <h1>Calendar</h1>
      <p>Plan local events, inspect availability, and connect time blocks to reminders and follow-up work.</p>
    </section>
    <div class="tabs">
      ${navLink("/calendar/day", "Day")}
      ${navLink("/calendar/week", "Week")}
      ${navLink("/calendar/month", "Month")}
      ${navLink("/calendar/agenda", "Agenda")}
      ${navLink("/calendars", "Calendars")}
    </div>
    <form id="event-form" class="form split">
      <label>Title <input name="title" required /></label>
      <label>Calendar
        <select name="calendar_id">${calendars.map((calendar) => `<option value="${calendar.id}">${escapeHtml(calendar.name)}</option>`).join("")}</select>
      </label>
      <label>Start <input name="start_at" type="datetime-local" required /></label>
      <label>End <input name="end_at" type="datetime-local" required /></label>
      <label>Location <input name="location" /></label>
      <label>Type
        <select name="event_type"><option>STANDARD</option><option>MEETING</option><option>APPOINTMENT</option><option>FOCUS_BLOCK</option><option>TRAVEL</option><option>PERSONAL</option><option>DEADLINE</option></select>
      </label>
      <label>Reminder offset minutes <input name="reminder_offsets" type="number" min="0" max="10080" /></label>
      <label>Description <input name="description" /></label>
      <button type="submit">Create event</button>
    </form>
    <section class="grid">
      ${summaryCard("Upcoming events", events)}
      ${summaryCard("Conflicts", conflicts)}
      ${summaryCard("Free blocks", availability.free)}
      ${summaryCard("Busy blocks", availability.busy)}
    </section>
    <section class="list">
      <h2>Agenda</h2>
      ${events.map(eventCard).join("") || "<p>No events in this window.</p>"}
    </section>
    <section class="list">
      <h2>Conflicts</h2>
      ${conflicts.map(conflictCard).join("") || "<p>No conflicts in this window.</p>"}
    </section>
    <section class="list">
      <h2>Availability</h2>
      ${(availability.free ?? []).map((slot) => `<article><h2>Free</h2><p>${escapeHtml(slot.start)} to ${escapeHtml(slot.end)}</p></article>`).join("") || "<p>No free blocks match the current minimum.</p>"}
    </section>
  `);
  document.querySelector("#event-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = normalizeDateBody(formBody(event.target), ["start_at", "end_at"]);
    if (body.reminder_offsets) {
      body.reminder_offsets = [Number(body.reminder_offsets)];
    } else {
      delete body.reminder_offsets;
    }
    await submit(() => fetchJson("/api/v1/events", { method: "POST", body }), renderCalendar);
  });
  bindEventButtons();
}

async function renderCalendars() {
  const payload = await safeFetch("/api/v1/calendars");
  const calendars = payload?.calendars ?? [];
  shell(`
    <section class="page-header"><h1>Calendars</h1><p>Local calendar sources and display preferences.</p></section>
    <div class="tabs">${navLink("/calendar", "Calendar")}${navLink("/calendars", "Calendars")}</div>
    <form id="calendar-form" class="form split">
      <label>Name <input name="name" required /></label>
      <label>Timezone <input name="timezone" value="${escapeHtml(state.user.timezone)}" required /></label>
      <label>Color <input name="color_key" value="blue" /></label>
      <label>Description <input name="description" /></label>
      <button type="submit">Create calendar</button>
    </form>
    <div class="list">${calendars.map(calendarCard).join("") || "<p>No calendars yet.</p>"}</div>
  `);
  document.querySelector("#calendar-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    await submit(() => fetchJson("/api/v1/calendars", { method: "POST", body: formBody(event.target) }), renderCalendars);
  });
  document.querySelectorAll("[data-calendar]").forEach((button) => {
    button.addEventListener("click", async () => {
      await submit(() => fetchJson(`/api/v1/calendars/${button.dataset.calendar}/${button.dataset.action}`, { method: "POST" }), renderCalendars);
    });
  });
}

async function renderTasks() {
  const payload = await safeFetch("/api/v1/tasks");
  const tasks = payload?.tasks ?? [];
  shell(`
    <section class="page-header"><h1>Tasks</h1><p>Create, complete, reopen, cancel, archive, and recur local tasks.</p></section>
    <form id="task-form" class="form split">
      <label>Title <input name="title" required /></label>
      <label>Priority
        <select name="priority"><option>NONE</option><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>URGENT</option></select>
      </label>
      <label>Due at <input name="due_at" type="datetime-local" /></label>
      <label>Estimated minutes <input name="estimated_minutes" type="number" min="1" max="1440" /></label>
      <label>Description <input name="description" /></label>
      <label>Recurrence
        <select name="recurrence_frequency"><option value="">None</option><option>DAILY</option><option>WEEKLY</option><option>MONTHLY</option><option>YEARLY</option></select>
      </label>
      <button type="submit">Create task</button>
    </form>
    <div class="list">${tasks.map(taskCard).join("") || "<p>No tasks yet.</p>"}</div>
  `);
  document.querySelector("#task-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = normalizeDateBody(formBody(event.target), ["due_at"]);
    await submit(() => fetchJson("/api/v1/tasks", { method: "POST", body }), renderTasks);
  });
  bindTaskButtons();
}

async function renderReminders() {
  const payload = await safeFetch("/api/v1/reminders");
  const notifications = await safeFetch("/api/v1/notifications");
  shell(`
    <section class="page-header"><h1>Reminders</h1><p>Schedule in-app reminders and manage delivered notifications.</p></section>
    <form id="reminder-form" class="form split">
      <label>Title <input name="title" required /></label>
      <label>Scheduled at <input name="scheduled_at" type="datetime-local" required /></label>
      <label>Message <input name="message" /></label>
      <button type="submit">Create reminder</button>
    </form>
    <h2>Notifications</h2>
    <div class="list">${(notifications?.notifications ?? []).map(notificationCard).join("") || "<p>No notifications.</p>"}</div>
    <h2>Reminders</h2>
    <div class="list">${(payload?.reminders ?? []).map(reminderCard).join("") || "<p>No reminders yet.</p>"}</div>
  `);
  document.querySelector("#reminder-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = normalizeDateBody(formBody(event.target), ["scheduled_at"]);
    await submit(() => fetchJson("/api/v1/reminders", { method: "POST", body }), renderReminders);
  });
  bindReminderButtons();
}

async function renderFollowups() {
  const payload = await safeFetch("/api/v1/followups");
  shell(`
    <section class="page-header"><h1>Follow-Ups</h1><p>Track waiting-for items and expected responses.</p></section>
    <form id="followup-form" class="form split">
      <label>Title <input name="title" required /></label>
      <label>Responsible party <input name="responsible_party" /></label>
      <label>Review at <input name="review_at" type="datetime-local" /></label>
      <label>Due at <input name="due_at" type="datetime-local" /></label>
      <label>Expected result <input name="expected_result" /></label>
      <label>Priority
        <select name="priority"><option>NONE</option><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>URGENT</option></select>
      </label>
      <button type="submit">Create follow-up</button>
    </form>
    <div class="list">${(payload?.followups ?? []).map(followupCard).join("") || "<p>No follow-ups yet.</p>"}</div>
  `);
  document.querySelector("#followup-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = normalizeDateBody(formBody(event.target), ["review_at", "due_at"]);
    await submit(() => fetchJson("/api/v1/followups", { method: "POST", body }), renderFollowups);
  });
  bindFollowupButtons();
}

async function renderActivity() {
  const payload = await safeFetch("/api/v1/activity");
  shell(`
    <section class="page-header"><h1>Activity</h1><p>Inspectable local productivity history.</p></section>
    <div class="list">${(payload?.activity ?? []).map((item) => `<article><h2>${escapeHtml(item.event_type)}</h2><p>${escapeHtml(item.summary)} · ${escapeHtml(item.occurred_at)}</p></article>`).join("") || "<p>No activity yet.</p>"}</div>
  `);
}

async function renderSettings() {
  const settings = await safeFetch("/api/v1/settings");
  shell(`
    <section class="page-header"><h1>Settings</h1><p>Manage profile and local preferences.</p></section>
    <div class="tabs">
      ${navLink("/settings/profile", "Profile")}
      ${navLink("/settings/preferences", "Preferences")}
      ${navLink("/settings/security", "Security")}
      ${navLink("/settings/sessions", "Sessions")}
    </div>
    <form id="profile-form" class="form split">
      <label>Display name <input name="display_name" value="${escapeHtml(state.user.display_name)}" required /></label>
      <label>Timezone <input name="timezone" value="${escapeHtml(settings?.settings?.timezone ?? state.user.timezone)}" required /></label>
      <label>Locale <input name="locale" value="${escapeHtml(settings?.settings?.locale ?? state.user.locale)}" required /></label>
      <label>Display density
        <select name="display_density">
          <option value="comfortable">Comfortable</option>
          <option value="compact">Compact</option>
        </select>
      </label>
      <button type="submit">Save settings</button>
    </form>
  `);
  document.querySelector("#profile-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = formBody(event.target);
    await submit(async () => {
      await fetchJson("/api/v1/users/me", { method: "PATCH", body: { display_name: body.display_name } });
      return fetchJson("/api/v1/settings", { method: "PATCH", body });
    }, async () => {
      await loadSession();
      renderSettings();
    });
  });
}

function renderSecurity() {
  shell(`
    <section class="page-header"><h1>Security</h1><p>Change your password. Other active sessions are revoked after a password change.</p></section>
    <form id="password-form" class="form">
      <label>Current password <input name="current_password" type="password" autocomplete="current-password" required /></label>
      <label>New password <input name="new_password" type="password" autocomplete="new-password" required /></label>
      <label>Confirm new password <input name="new_password_confirmation" type="password" autocomplete="new-password" required /></label>
      <button type="submit">Change password</button>
    </form>
  `, { narrow: true });
  document.querySelector("#password-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    await submit(() => fetchJson("/api/v1/auth/password/change", { method: "POST", body: formBody(event.target) }), async () => {
      state.error = "Password changed.";
      renderSecurity();
    });
  });
}

async function renderSessions() {
  const payload = await safeFetch("/api/v1/auth/sessions");
  const sessions = payload?.sessions ?? [];
  shell(`
    <section class="page-header"><h1>Active sessions</h1><p>Inspect and revoke browser sessions.</p></section>
    <div class="list">
      ${sessions.map((session) => `
        <article>
          <h2>${session.current ? "Current session" : "Session"}</h2>
          <p>${escapeHtml(session.user_agent_summary)} · expires ${escapeHtml(session.expires_at)}</p>
          ${session.current ? "" : `<button data-revoke="${session.id}" type="button">Revoke</button>`}
        </article>
      `).join("")}
    </div>
    <button id="revoke-others" type="button">Revoke other sessions</button>
  `);
  document.querySelectorAll("[data-revoke]").forEach((button) => {
    button.addEventListener("click", async () => {
      await submit(() => fetchJson(`/api/v1/auth/sessions/${button.dataset.revoke}`, { method: "DELETE" }), renderSessions);
    });
  });
  document.querySelector("#revoke-others").addEventListener("click", async () => {
    await submit(() => fetchJson("/api/v1/auth/sessions/revoke-others", { method: "POST" }), renderSessions);
  });
}

function renderSessionExpired() {
  shell(`<section class="page-header"><h1>Your session expired</h1><p>Sign in again to continue.</p><a class="button" href="/login" data-link>Sign in</a></section>`, { narrow: true });
}

function renderErrorPage() {
  shell(`<section class="page-header"><h1>Something went wrong</h1><p>No changes were made. Try again or check health.</p></section>`, { narrow: true });
}

function renderNotFound() {
  shell(`<section class="page-header"><h1>Not found</h1><p>This page does not exist.</p></section>`, { narrow: true });
}

async function logout() {
  await fetchJson("/api/v1/auth/logout", { method: "POST" }).catch(() => null);
  state.user = null;
  state.session = null;
  navigate("/login");
}

async function submit(action, onSuccess, fallback) {
  try {
    state.error = null;
    await action();
    await onSuccess();
  } catch (error) {
    state.error = error instanceof ApiClientError ? error.message : fallback ?? "The operation failed.";
    route();
  }
}

async function safeFetch(path) {
  try {
    return await fetchJson(path);
  } catch {
    return null;
  }
}

async function safePost(path, body) {
  try {
    return await fetchJson(path, { method: "POST", body });
  } catch {
    return null;
  }
}

function bindLinks() {
  document.querySelectorAll("[data-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      app.classList.remove("nav-open");
      navigate(link.getAttribute("href"));
    });
  });
}

function bindShellControls() {
  const toggle = document.querySelector("#nav-toggle");
  toggle?.addEventListener("click", () => {
    const open = !app.classList.contains("nav-open");
    app.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });
}

function navigate(path) {
  if (!path.startsWith("/")) {
    path = "/";
  }
  history.pushState({}, "", path);
  route();
}

function formBody(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function assistantTabs() {
  return `${navLink("/assistant", "Chat")}${navLink("/assistant/plans", "Plans")}${navLink("/assistant/actions", "Actions")}${navLink("/conversations", "Conversations")}${navLink("/assistant/settings", "AI Settings")}`;
}

function summaryCard(title, items = []) {
  return `<article><h2>${escapeHtml(title)}</h2><p>${items.length}</p></article>`;
}

function metricCard(label, value, detail, tone = "success") {
  return `
    <article class="metric-card tone-${tone}">
      <div class="metric-icon" aria-hidden="true"></div>
      <div>
        <strong>${escapeHtml(value)}</strong>
        <span>${escapeHtml(label)}</span>
        <small>${escapeHtml(detail)}</small>
      </div>
    </article>
  `;
}

function panel(title, actionLabel, actionHref, body) {
  return `
    <section class="glass-panel">
      <header class="panel-header">
        <h2>${escapeHtml(title)}</h2>
        ${actionLabel ? `<a class="ghost-button" href="${actionHref}" data-link>${escapeHtml(actionLabel)}</a>` : ""}
      </header>
      ${body}
    </section>
  `;
}

function scheduleList(events) {
  const fallback = [
    { title: "Focus time", subtitle: "Deep work session", time: "9:00 AM", type: "Now" },
    { title: "Project sync", subtitle: "Web conference", time: "10:00 AM", type: "Team" },
    { title: "Lunch", subtitle: "Break", time: "12:00 PM", type: "Break" },
    { title: "Client review", subtitle: "Review proposal", time: "1:30 PM", type: "Work" },
  ];
  const rows = (events.length ? events : fallback).slice(0, 5).map((event, index) => {
    const title = event.title ?? event.summary ?? fallback[index]?.title ?? "Scheduled item";
    const subtitle = event.description ?? event.location ?? fallback[index]?.subtitle ?? "Local calendar";
    const time = event.start_at ? formatTime(event.start_at) : event.time ?? fallback[index]?.time ?? "";
    const type = event.event_type ?? event.type ?? fallback[index]?.type ?? "Event";
    return `
      <div class="schedule-row">
        <time>${escapeHtml(time)}</time>
        <span class="timeline-dot dot-${index % 5}" aria-hidden="true"></span>
        <div class="schedule-card">
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(subtitle)}</span>
          <em>${escapeHtml(type)}</em>
        </div>
      </div>
    `;
  }).join("");
  return `<div class="schedule-list">${rows}</div><a class="inline-action" href="/calendar" data-link>+ Add Time Block</a>`;
}

function priorityTaskList(tasks) {
  const fallback = [
    { title: "Finalize project proposal", status: "Today", category: "Work" },
    { title: "Review budget", status: "Today", category: "Work" },
    { title: "Follow up with Alex", status: "Today", category: "Personal" },
    { title: "Draft email to team", status: "Yesterday", category: "Work", done: true },
  ];
  const rows = (tasks.length ? tasks : fallback).slice(0, 6).map((task) => {
    const done = task.status === "COMPLETED" || task.done;
    const title = task.title ?? "Untitled task";
    const category = task.project_name ?? task.category ?? "Work";
    const due = task.due_at ? relativeDay(task.due_at) : task.status ?? "Today";
    return `
      <div class="task-row ${done ? "is-done" : ""}">
        <span class="task-check" aria-hidden="true">${done ? "✓" : ""}</span>
        <strong>${escapeHtml(title)}</strong>
        <em>${escapeHtml(category)}</em>
        <time>${escapeHtml(due)}</time>
      </div>
    `;
  }).join("");
  return `<div class="task-list">${rows}</div><a class="inline-action" href="/tasks" data-link>+ Add Task</a>`;
}

function recentNotesList(notes) {
  const fallback = [
    { title: "Project Ideas", summary: "Ideas for the new product initiative...", updated_at: "2h ago" },
    { title: "Meeting Notes - 5/14", summary: "Discussed timeline and deliverables...", updated_at: "Yesterday" },
    { title: "Book Notes: Atomic Habits", summary: "Key takeaways and insights...", updated_at: "May 13" },
  ];
  const rows = (notes.length ? notes : fallback).slice(0, 3).map((note, index) => `
    <a class="note-row" href="${note.id ? `/notes/${note.id}` : "/notes"}" data-link>
      <span class="note-glyph glyph-${index}" aria-hidden="true"></span>
      <span><strong>${escapeHtml(note.title ?? "Untitled note")}</strong><small>${escapeHtml(note.summary ?? note.excerpt ?? "No preview available.")}</small></span>
      <time>${escapeHtml(shortDate(note.updated_at ?? note.created_at))}</time>
    </a>
  `).join("");
  return `<div class="note-list">${rows}</div>`;
}

function suggestionList(today) {
  const suggestions = [
    `You have ${(today.due_today_tasks ?? []).length} tasks due today.`,
    (today.calendar_events ?? []).length ? "Review your calendar before the next meeting." : "Block focus time for your highest priority task.",
    (today.waiting_items ?? []).length ? "Consider scheduling a follow-up for a waiting item." : "Capture one note from today's planning session.",
  ];
  return `
    <div class="suggestion-list">
      ${suggestions.map((item, index) => `<div class="suggestion-row"><span class="suggestion-icon icon-${index}" aria-hidden="true"></span><p>${escapeHtml(item)}</p></div>`).join("")}
    </div>
    <a class="inline-action" href="/assistant" data-link>View all suggestions -></a>
  `;
}

function conversationPanel(conversations) {
  const latest = conversations[0];
  return `
    <section class="glass-panel rail-panel">
      <header class="panel-header"><h2>Recent Conversation</h2><a class="ghost-button" href="/assistant" data-link>New Chat</a></header>
      <div class="chat-preview user">Summarize my tasks and meetings for today.</div>
      <div class="chat-preview assistant">${escapeHtml(latest?.title ? `Open "${latest.title}" or start a new daily briefing.` : "Of course. I can summarize today's tasks, events, reminders, and follow-ups.")}</div>
      <a class="inline-action" href="/conversations" data-link>View all conversations -></a>
    </section>
  `;
}

function integrationsPanel(connectorsList) {
  const fallback = ["Google Calendar", "Gmail", "Google Drive", "Notion", "Microsoft To Do"];
  const rows = (connectorsList.length ? connectorsList.map((connector) => connector.display_name) : fallback).slice(0, 5).map((name) => `
    <div class="integration-row"><span class="integration-logo" aria-hidden="true"></span><strong>${escapeHtml(name)}</strong><span>Connected</span><em aria-hidden="true">✓</em></div>
  `).join("");
  return `<section class="glass-panel rail-panel"><header class="panel-header"><h2>Integrations</h2><a class="ghost-button" href="/connectors" data-link>Manage</a></header>${rows}</section>`;
}

function quickActionsPanel() {
  return `
    <section class="glass-panel rail-panel">
      <header class="panel-header"><h2>Quick Actions</h2></header>
      <div class="quick-grid">
        <a class="quick-action success" href="/tasks" data-link>Add Task</a>
        <a class="quick-action warning" href="/reminders" data-link>Add Reminder</a>
        <a class="quick-action purple" href="/notes" data-link>Create Note</a>
        <a class="quick-action blue" href="/assistant" data-link>Start Conversation</a>
      </div>
    </section>
  `;
}

function systemStatusPanel(health) {
  return `
    <section class="glass-panel system-panel">
      <header class="panel-header"><h2>System Status</h2></header>
      <p class="system-ok">All systems operational</p>
      ${statusLine("AI Gateway", "Online")}
      ${statusLine("Scheduler", health?.components?.scheduler ?? "unknown")}
      ${statusLine("Sync Service", health?.components?.connectors ?? "unknown")}
      ${statusLine("Last Backup", health?.operational?.backup?.status ?? "missing")}
      <a class="ghost-button wide-button" href="/operations" data-link>View Diagnostics</a>
    </section>
  `;
}

function statusLine(label, value) {
  return `<div class="status-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><em aria-hidden="true">✓</em></div>`;
}

function nextEventLabel(events) {
  if (!events?.length) {
    return "Next: open";
  }
  return `Next: ${formatTime(events[0].start_at)}`;
}

function formatTime(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function relativeDay(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  const today = new Date();
  return date.toDateString() === today.toDateString() ? "Today" : shortDate(value);
}

function shortDate(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function backupCard(backup) {
  return `
    <article>
      <h2>${escapeHtml(backup.backup_type)} backup</h2>
      <p>${escapeHtml(backup.status)} · schema ${escapeHtml(backup.schema_version)} · ${escapeHtml(backup.size_bytes)} bytes</p>
      <p>${escapeHtml(backup.created_at)}${backup.verified_at ? ` · verified ${escapeHtml(backup.verified_at)}` : ""}</p>
      <p>${escapeHtml(backup.file_path)}</p>
      <div class="actions">
        <button data-backup="${backup.id}" data-action="verify" type="button">Verify</button>
        <button data-backup="${backup.id}" data-action="restore" type="button">Restore rehearsal</button>
      </div>
    </article>
  `;
}

function restoreCard(restore) {
  return `
    <article>
      <h2>${escapeHtml(restore.restore_type)} restore</h2>
      <p>${escapeHtml(restore.status)} · schema ${escapeHtml(restore.schema_version ?? "unknown")}</p>
      <p>${escapeHtml(restore.created_at)}${restore.completed_at ? ` · completed ${escapeHtml(restore.completed_at)}` : ""}</p>
      <p>${escapeHtml(restore.target_path ?? restore.source_path)}</p>
    </article>
  `;
}

function checkCard(check) {
  return `
    <article>
      <h2>${escapeHtml(check.check_name)}</h2>
      <p>${escapeHtml(check.category)} · ${escapeHtml(check.status)} · ${escapeHtml(check.severity)}</p>
      <p>${escapeHtml(check.message)}</p>
    </article>
  `;
}

function releaseCard(release) {
  return `
    <article>
      <h2>${escapeHtml(release.version)}</h2>
      <p>${escapeHtml(release.result)} · ${escapeHtml(release.created_at)}</p>
      <p>${Object.entries(release.checklist ?? {}).map(([key, value]) => `${escapeHtml(key)}: ${escapeHtml(String(value))}`).join(" · ")}</p>
    </article>
  `;
}

function bindOperationButtons() {
  document.querySelectorAll("[data-backup]").forEach((button) => {
    button.addEventListener("click", async () => {
      const backupId = button.dataset.backup;
      if (button.dataset.action === "verify") {
        await submit(() => fetchJson(`/api/v1/system/backups/${backupId}/verify`, { method: "POST", body: {}, timeoutMs: 10000 }), renderOperations);
      }
      if (button.dataset.action === "restore") {
        await submit(() => fetchJson("/api/v1/system/restore-rehearsal", { method: "POST", body: { backup_id: backupId }, timeoutMs: 10000 }), renderOperations);
      }
    });
  });
}

function notificationCard(notification) {
  return `
    <article>
      <h2>${escapeHtml(notification.title)}</h2>
      <p>${escapeHtml(notification.message ?? "")}</p>
      <p>${escapeHtml(notification.status)} · ${escapeHtml(notification.created_at)}</p>
    </article>
  `;
}

function conversationCard(conversation) {
  return `
    <article>
      <h2><a href="/conversations/${conversation.id}" data-link>${escapeHtml(conversation.title)}</a></h2>
      <p>${escapeHtml(conversation.status)} · ${escapeHtml(conversation.message_count ?? conversation.messages?.length ?? 0)} messages · ${escapeHtml(conversation.updated_at)}</p>
      <p>${conversation.highlighted_excerpt ?? ""}</p>
      <div class="actions">
        <a class="button" href="/conversations/${conversation.id}" data-link>Open</a>
        <button data-conversation="${conversation.id}" data-action="archive" type="button">Archive</button>
        <button data-conversation="${conversation.id}" data-action="restore" type="button">Restore</button>
      </div>
    </article>
  `;
}

function messageCard(message) {
  return `
    <article>
      <h2>${escapeHtml(message.role)}</h2>
      <p>${escapeHtml(message.created_at)}${message.provider ? ` · ${escapeHtml(message.provider)} · ${escapeHtml(message.model)} · ${escapeHtml(message.prompt_version)}` : ""}</p>
      <p>${escapeHtml(message.content)}</p>
      ${message.token_usage?.response_tokens ? `<p>${escapeHtml(message.token_usage.request_tokens)} request tokens · ${escapeHtml(message.token_usage.response_tokens)} response tokens</p>` : ""}
    </article>
  `;
}

function promptCard(prompt) {
  return `
    <article>
      <h2>${escapeHtml(prompt.name)}</h2>
      <p>${escapeHtml(prompt.category)} · ${escapeHtml(prompt.active_version ?? "")}</p>
      <p>${escapeHtml(prompt.description ?? "")}</p>
      <pre class="json">${escapeHtml(prompt.active_content ?? "")}</pre>
    </article>
  `;
}

function usageCard(usage) {
  return `
    <article>
      <h2>${escapeHtml(usage.provider)} · ${escapeHtml(usage.model)}</h2>
      <p>${escapeHtml(usage.status)} · ${escapeHtml(usage.prompt_version)} · ${escapeHtml(usage.latency_ms)}ms</p>
      <p>${escapeHtml(usage.request_tokens)} request tokens · ${escapeHtml(usage.response_tokens)} response tokens · $${Number(usage.estimated_cost).toFixed(4)}</p>
    </article>
  `;
}

function healthCard(health) {
  return `<article><h2>${escapeHtml(health.provider)} · ${escapeHtml(health.model)}</h2><p>${escapeHtml(health.status)} · ${escapeHtml(health.latency_ms)}ms</p><p>${escapeHtml(health.message ?? "")}</p></article>`;
}

function planDetailCard(plan) {
  return `
    <article>
      <h2>Execution Plan</h2>
      <p>${escapeHtml(plan.estimated_complexity)} · ${plan.requires_confirmation ? "confirmation required" : "read-only preview"} · ${escapeHtml(plan.status)}</p>
      <p>${escapeHtml(plan.explanation)}</p>
      <h2>Steps</h2>
      ${(plan.steps ?? []).map((step) => `<p><strong>${escapeHtml(step.name)}</strong>: ${escapeHtml(step.description)}</p>`).join("")}
      <h2>Tools</h2>
      <p>${escapeHtml((plan.required_tools ?? []).join(", ") || "None")}</p>
    </article>
  `;
}

function toolCard(tool) {
  return `
    <article>
      <h2>${escapeHtml(tool.name)}</h2>
      <p>${tool.read_only ? "Read-only" : "Write-capable"} · ${escapeHtml(tool.id)}</p>
      <p>${escapeHtml(tool.description)}</p>
    </article>
  `;
}

function planningMetricCard(metric) {
  return `
    <article>
      <h2>${escapeHtml(metric.status)}</h2>
      <p>${escapeHtml(metric.planning_time_ms)}ms · ${escapeHtml(metric.context_record_count)} records · confidence ${Number(metric.confidence).toFixed(2)}</p>
      <p>${escapeHtml((metric.selected_tools ?? []).join(", ") || "No tools")}</p>
    </article>
  `;
}

function actionProposalCard(proposal) {
  const pending = proposal.status === "AWAITING_CONFIRMATION";
  const approved = proposal.status === "APPROVED";
  return `
    <article>
      <h2>${escapeHtml(proposal.title)}</h2>
      <p>${escapeHtml(proposal.status)} · ${escapeHtml(proposal.tool_name)} · authority ${escapeHtml(proposal.authority_level)}</p>
      <p>${escapeHtml(proposal.summary)}</p>
      <h2>Review</h2>
      <p>Expected: ${escapeHtml((proposal.expected_changes ?? []).join("; ") || "No expected changes listed")}</p>
      <p>Rollback: ${escapeHtml(proposal.reversibility)}</p>
      <p>Expires: ${escapeHtml(proposal.expires_at)}</p>
      <pre class="json">${escapeHtml(JSON.stringify(proposal.after_state?.input_payload ?? {}, null, 2))}</pre>
      <div class="actions">
        ${pending ? `<button data-proposal-approve="${proposal.id}" type="button">Approve</button><button data-proposal-reject="${proposal.id}" type="button">Reject</button>` : ""}
        ${approved ? `<button data-proposal-execute="${proposal.id}" type="button">Execute</button>` : ""}
      </div>
      <h2>History</h2>
      ${(proposal.history ?? []).map((item) => `<p>${escapeHtml(item.event_type)} · ${escapeHtml(item.created_at)} · ${escapeHtml(item.note ?? "")}</p>`).join("") || "<p>No history.</p>"}
    </article>
  `;
}

function executionCard(execution) {
  const rollback = (execution.rollback_records ?? []).find((record) => record.status === "AVAILABLE");
  return `
    <article>
      <h2>${escapeHtml(execution.proposal?.title ?? execution.tool_name)}</h2>
      <p>${escapeHtml(execution.status)} · verification ${escapeHtml(execution.verification_status)} · ${escapeHtml(execution.tool_name)}</p>
      <p>${escapeHtml(execution.error_message ?? execution.completed_at ?? execution.created_at)}</p>
      <pre class="json">${escapeHtml(JSON.stringify(execution.output_payload ?? {}, null, 2))}</pre>
      <div class="actions">
        ${rollback ? `<button data-execution-rollback="${execution.id}" type="button">Rollback</button>` : ""}
      </div>
    </article>
  `;
}

function memoryCard(memory) {
  return `
    <article>
      <h2>${escapeHtml(memory.title)}</h2>
      <p>${escapeHtml(memory.category)} · ${escapeHtml(memory.status)} · ${escapeHtml(memory.sensitivity)} · confidence ${Number(memory.confidence).toFixed(2)}</p>
      <p>${escapeHtml(memory.content)}</p>
      <p>${memory.valid_until ? `Valid until ${escapeHtml(memory.valid_until)} · ` : ""}${memory.last_used_at ? `Used ${escapeHtml(memory.last_used_at)}` : "Not retrieved yet"}</p>
      <div class="actions">
        ${memory.status === "ACTIVE" ? `<button data-memory="${memory.id}" data-action="archive" type="button">Archive</button>` : ""}
        ${memory.status === "ARCHIVED" ? `<button data-memory="${memory.id}" data-action="restore" type="button">Restore</button>` : ""}
        ${memory.status !== "DELETED" ? `<button data-memory-delete="${memory.id}" type="button">Delete</button>` : ""}
      </div>
    </article>
  `;
}

function memoryProposalCard(proposal) {
  return `
    <article>
      <h2>${escapeHtml(proposal.title)}</h2>
      <p>${escapeHtml(proposal.category)} · ${escapeHtml(proposal.status)} · confidence ${Number(proposal.confidence).toFixed(2)}</p>
      <p>${escapeHtml(proposal.content)}</p>
      <p>${escapeHtml(proposal.reason)}</p>
      <div class="actions">
        ${proposal.status === "PROPOSED" ? `<button data-memory-proposal="${proposal.id}" data-decision="REMEMBER" type="button">Remember</button><button data-memory-proposal="${proposal.id}" data-decision="TEMPORARY" type="button">Remember Temporarily</button><button data-memory-proposal="${proposal.id}" data-decision="REJECT" type="button">Do Not Remember</button>` : ""}
      </div>
    </article>
  `;
}

function outcomeCard(outcome) {
  return `
    <article>
      <h2>${escapeHtml(outcome.recommendation)}</h2>
      <p>${outcome.accepted ? "Accepted" : "Not accepted"} · ${outcome.completed ? "Completed" : "Open"} · satisfaction ${escapeHtml(outcome.satisfaction)}</p>
      <p>${escapeHtml(outcome.notes ?? "")}</p>
    </article>
  `;
}

function routineCard(routine) {
  return `
    <article>
      <h2>${escapeHtml(routine.name)}</h2>
      <p>${escapeHtml(routine.status)} · ${escapeHtml(routine.cadence)}</p>
      <p>${escapeHtml(routine.description ?? "")}</p>
    </article>
  `;
}

function automationCard(automation) {
  return `
    <article>
      <h2>${escapeHtml(automation.name)}</h2>
      <p>${escapeHtml(automation.status)} · ${escapeHtml(automation.automation_type)} · authority ${escapeHtml(automation.authority_level)}</p>
      <p>${escapeHtml(automation.description ?? "")}</p>
      <p>Next run: ${escapeHtml(automation.next_run_at ?? "Manual only")} · Last run: ${escapeHtml(automation.last_run_at ?? "Never")}</p>
      <p>Trigger: ${escapeHtml(automation.trigger.type)} · Steps: ${escapeHtml(automation.workflow.steps.length)}</p>
      <div class="actions">
        <button data-automation="${automation.id}" data-action="run" type="button">Run now</button>
        ${automation.status === "ACTIVE" ? `<button data-automation="${automation.id}" data-action="pause" type="button">Pause</button>` : ""}
        ${automation.status === "PAUSED" || automation.status === "DISABLED" ? `<button data-automation="${automation.id}" data-action="resume" type="button">Resume</button>` : ""}
        ${automation.status !== "ARCHIVED" ? `<button data-automation="${automation.id}" data-action="archive" type="button">Archive</button>` : ""}
      </div>
    </article>
  `;
}

function schedulerJobCard(job) {
  return `
    <article>
      <h2>${escapeHtml(job.status)}</h2>
      <p>${escapeHtml(job.scheduled_for)} · attempts ${escapeHtml(job.attempt_count)}</p>
      <p>${escapeHtml(job.last_error ?? job.idempotency_key)}</p>
    </article>
  `;
}

function automationExecutionCard(execution) {
  return `
    <article>
      <h2>${escapeHtml(execution.automation?.name ?? execution.automation_id)}</h2>
      <p>${escapeHtml(execution.status)} · ${escapeHtml(execution.trigger_type)} · ${escapeHtml(execution.duration_ms)}ms</p>
      <p>${escapeHtml(execution.error_message ?? execution.completed_at ?? execution.started_at ?? execution.created_at)}</p>
      <p>${escapeHtml((execution.steps ?? []).length)} workflow step(s)</p>
    </article>
  `;
}

function connectorRegistryCard(item) {
  return `
    <article>
      <h2>${escapeHtml(item.display_name)}</h2>
      <p>${escapeHtml(item.connector_type)} · ${escapeHtml(item.provider)}</p>
      <p>Capabilities: ${escapeHtml((item.capabilities ?? []).join(", "))}</p>
      <p>Permissions: ${escapeHtml((item.supported_permissions ?? []).join(", "))}</p>
    </article>
  `;
}

function connectorCard(connector) {
  return `
    <article>
      <h2>${escapeHtml(connector.display_name)}</h2>
      <p>${escapeHtml(connector.status)} · auth ${escapeHtml(connector.authorization_state)} · ${escapeHtml(connector.connector_type)}</p>
      <p>Scopes: ${escapeHtml((connector.granted_scopes?.length ? connector.granted_scopes : connector.requested_scopes ?? []).join(", "))}</p>
      <p>Health: ${escapeHtml(connector.health?.status ?? "unknown")} · ${escapeHtml(connector.health?.message ?? "")}</p>
      <p>Last sync: ${escapeHtml(connector.last_sync_at ?? "Never")}</p>
      <div class="actions">
        ${connector.authorization_state !== "AUTHORIZED" ? `<button data-connector="${connector.id}" data-action="authorize" type="button">Authorize</button>` : ""}
        <button data-connector="${connector.id}" data-action="health" type="button">Health</button>
        <button data-connector="${connector.id}" data-action="sync" type="button">Synchronize now</button>
        <button data-connector="${connector.id}" data-action="refresh" type="button">Refresh auth</button>
        <button data-connector="${connector.id}" data-action="disconnect" type="button">Disconnect</button>
      </div>
    </article>
  `;
}

function syncCard(sync) {
  return `
    <article>
      <h2>${escapeHtml(sync.status)}</h2>
      <p>${escapeHtml(sync.mode)} · imported ${escapeHtml(sync.imported_count)} · exported ${escapeHtml(sync.exported_count)} · conflicts ${escapeHtml(sync.conflict_count)}</p>
      <p>${escapeHtml(sync.error_message ?? sync.completed_at ?? sync.started_at ?? sync.created_at)}</p>
    </article>
  `;
}

function conflictSyncCard(conflict) {
  return `
    <article>
      <h2>${escapeHtml(conflict.external_type)} · ${escapeHtml(conflict.status)}</h2>
      <p>${escapeHtml(conflict.external_id)} · ${escapeHtml(conflict.resolution ?? "unresolved")}</p>
      <div class="actions">
        ${conflict.status === "OPEN" ? `<button data-sync-conflict="${conflict.id}" data-resolution="LOCAL" type="button">Local</button><button data-sync-conflict="${conflict.id}" data-resolution="REMOTE" type="button">Remote</button><button data-sync-conflict="${conflict.id}" data-resolution="MERGE" type="button">Merge</button><button data-sync-conflict="${conflict.id}" data-resolution="CANCEL" type="button">Cancel</button>` : ""}
      </div>
    </article>
  `;
}

function externalRecordCard(record) {
  return `
    <article>
      <h2>${escapeHtml(record.title)}</h2>
      <p>${escapeHtml(record.provider)} · ${escapeHtml(record.record_type)} · ${escapeHtml(record.external_id)}</p>
      <p>${escapeHtml(record.summary ?? "")}</p>
    </article>
  `;
}

function noteCard(note) {
  return `
    <article>
      <h2><a href="/notes/${note.id}" data-link>${escapeHtml(note.title)}</a></h2>
      <p>${note.is_favorite ? "Favorite · " : ""}${escapeHtml(note.status)} · version ${escapeHtml(note.version)} · ${escapeHtml(note.word_count)} words</p>
      <p>${escapeHtml((note.tags ?? []).join(", ") || "No tags")}</p>
      <div class="actions">
        <a class="button" href="/notes/${note.id}" data-link>Open</a>
        <button data-note="${note.id}" data-action="favorite" type="button">Favorite</button>
        <button data-note="${note.id}" data-action="archive" type="button">Archive</button>
      </div>
    </article>
  `;
}

function notebookCard(notebook) {
  return `
    <article>
      <h2>${escapeHtml(notebook.name)}</h2>
      <p>${notebook.is_default ? "Default" : "Notebook"} · ${escapeHtml(notebook.color_key)}</p>
      <p>${escapeHtml(notebook.description ?? "")}</p>
      <div class="actions">
        ${notebook.is_default ? "" : `<button data-notebook="${notebook.id}" data-action="set-default" type="button">Set default</button><button data-notebook="${notebook.id}" data-action="archive" type="button">Archive</button>`}
      </div>
    </article>
  `;
}

function attachmentCard(attachment) {
  return `
    <article>
      <h2>${escapeHtml(attachment.filename)}</h2>
      <p>${escapeHtml(attachment.media_type)} · ${escapeHtml(attachment.size_bytes)} bytes</p>
      <p>${escapeHtml(attachment.checksum)}</p>
      <button data-attachment-delete="${attachment.id}" type="button">Remove</button>
    </article>
  `;
}

function linkCard(link) {
  return `<article><h2>${escapeHtml(link.relationship_type)}</h2><p>${escapeHtml(link.target_type)} · ${escapeHtml(link.target_id)}</p></article>`;
}

function versionCard(version) {
  return `
    <article>
      <h2>Version ${escapeHtml(version.version_number)}</h2>
      <p>${escapeHtml(version.title)} · ${escapeHtml(version.created_at)}</p>
      <button data-version="${version.version_number}" type="button">Restore</button>
    </article>
  `;
}

function searchResultCard(result) {
  const href = result.record_type === "NOTE" ? `/notes/${result.record_id}` : "/attachments";
  return `
    <article>
      <h2><a href="${href}" data-link>${escapeHtml(result.title)}</a></h2>
      <p>${escapeHtml(result.record_type)} · score ${Number(result.relevance_score).toFixed(2)}</p>
      <p>${result.highlighted_excerpt}</p>
    </article>
  `;
}

function eventCard(event) {
  const start = event.is_all_day ? event.start_date : event.start_at;
  const end = event.is_all_day ? event.end_date : event.end_at;
  return `
    <article>
      <h2>${escapeHtml(event.title)}</h2>
      <p>${escapeHtml(event.status)} · ${escapeHtml(event.event_type)} · ${escapeHtml(start ?? "")} to ${escapeHtml(end ?? "")}</p>
      <p>${escapeHtml(event.location ?? event.description ?? "")}</p>
      <div class="actions">
        <button data-event="${event.id}" data-action="confirm" type="button">Confirm</button>
        <button data-event="${event.id}" data-action="tentative" type="button">Tentative</button>
        <button data-event="${event.id}" data-action="cancel" type="button">Cancel</button>
        <button data-event="${event.id}" data-action="archive" type="button">Archive</button>
      </div>
    </article>
  `;
}

function conflictCard(conflict) {
  const titles = (conflict.events ?? []).map((event) => event.title).join(" / ");
  return `<article><h2>${escapeHtml(conflict.severity)}</h2><p>${escapeHtml(titles)}</p><p>${escapeHtml(conflict.explanation)}</p></article>`;
}

function calendarCard(calendar) {
  return `
    <article>
      <h2>${escapeHtml(calendar.name)}</h2>
      <p>${calendar.is_default ? "Default" : "Calendar"} · ${escapeHtml(calendar.timezone)} · ${escapeHtml(calendar.color_key)}</p>
      <p>${escapeHtml(calendar.description ?? "")}</p>
      <div class="actions">
        ${calendar.is_default ? "" : `<button data-calendar="${calendar.id}" data-action="set-default" type="button">Set default</button><button data-calendar="${calendar.id}" data-action="archive" type="button">Archive</button>`}
      </div>
    </article>
  `;
}

function taskCard(task) {
  return `
    <article>
      <h2>${escapeHtml(task.title)}</h2>
      <p>${escapeHtml(task.status)} · ${escapeHtml(task.priority)} · ${escapeHtml(task.due_classification)}</p>
      <p>${escapeHtml(task.description ?? "")}</p>
      <div class="actions">
        <button data-task="${task.id}" data-action="complete" type="button">Complete</button>
        <button data-task="${task.id}" data-action="reopen" type="button">Reopen</button>
        <button data-task="${task.id}" data-action="cancel" type="button">Cancel</button>
        <button data-task="${task.id}" data-action="archive" type="button">Archive</button>
      </div>
    </article>
  `;
}

function reminderCard(reminder) {
  return `
    <article>
      <h2>${escapeHtml(reminder.title)}</h2>
      <p>${escapeHtml(reminder.status)} · ${escapeHtml(reminder.scheduled_at)}</p>
      <p>${escapeHtml(reminder.message ?? "")}</p>
      <div class="actions">
        <button data-reminder="${reminder.id}" data-action="acknowledge" type="button">Acknowledge</button>
        <button data-reminder="${reminder.id}" data-action="snooze" type="button">Snooze 10m</button>
        <button data-reminder="${reminder.id}" data-action="complete" type="button">Complete</button>
        <button data-reminder="${reminder.id}" data-action="cancel" type="button">Cancel</button>
      </div>
    </article>
  `;
}

function followupCard(followup) {
  return `
    <article>
      <h2>${escapeHtml(followup.title)}</h2>
      <p>${escapeHtml(followup.status)} · ${escapeHtml(followup.priority)} · ${escapeHtml(followup.timing_classification)}</p>
      <p>${escapeHtml(followup.responsible_party ?? "No responsible party")}</p>
      <div class="actions">
        <button data-followup="${followup.id}" data-action="record-contact" type="button">Record contact</button>
        <button data-followup="${followup.id}" data-action="resolve" type="button">Resolve</button>
        <button data-followup="${followup.id}" data-action="reopen" type="button">Reopen</button>
        <button data-followup="${followup.id}" data-action="archive" type="button">Archive</button>
      </div>
    </article>
  `;
}

function bindTaskButtons() {
  document.querySelectorAll("[data-task]").forEach((button) => {
    button.addEventListener("click", async () => {
      await submit(() => fetchJson(`/api/v1/tasks/${button.dataset.task}/${button.dataset.action}`, { method: "POST" }), renderTasks);
    });
  });
}

function bindReminderButtons() {
  document.querySelectorAll("[data-reminder]").forEach((button) => {
    button.addEventListener("click", async () => {
      const body = button.dataset.action === "snooze" ? { snoozed_until: new Date(Date.now() + 10 * 60 * 1000).toISOString() } : {};
      await submit(() => fetchJson(`/api/v1/reminders/${button.dataset.reminder}/${button.dataset.action}`, { method: "POST", body }), renderReminders);
    });
  });
}

function bindFollowupButtons() {
  document.querySelectorAll("[data-followup]").forEach((button) => {
    button.addEventListener("click", async () => {
      await submit(() => fetchJson(`/api/v1/followups/${button.dataset.followup}/${button.dataset.action}`, { method: "POST", body: {} }), renderFollowups);
    });
  });
}

function bindEventButtons() {
  document.querySelectorAll("[data-event]").forEach((button) => {
    button.addEventListener("click", async () => {
      await submit(() => fetchJson(`/api/v1/events/${button.dataset.event}/${button.dataset.action}`, { method: "POST", body: {} }), renderCalendar);
    });
  });
}

function bindActionButtons() {
  document.querySelectorAll("[data-proposal-approve]").forEach((button) => {
    button.addEventListener("click", async () => {
      await submit(async () => {
        const payload = await fetchJson(`/api/v1/proposals/${button.dataset.proposalApprove}/approve`, {
          method: "POST",
          body: { confirmation_text: "APPROVE" },
        });
        sessionStorage.setItem(`d2d-action-token-${button.dataset.proposalApprove}`, payload.action_token);
      }, renderAssistantActions);
    });
  });
  document.querySelectorAll("[data-proposal-reject]").forEach((button) => {
    button.addEventListener("click", async () => {
      await submit(() => fetchJson(`/api/v1/proposals/${button.dataset.proposalReject}/reject`, { method: "POST", body: { note: "Rejected in review." } }), renderAssistantActions);
    });
  });
  document.querySelectorAll("[data-proposal-execute]").forEach((button) => {
    button.addEventListener("click", async () => {
      const proposalId = button.dataset.proposalExecute;
      const actionToken = sessionStorage.getItem(`d2d-action-token-${proposalId}`) ?? "";
      await submit(() => fetchJson("/api/v1/executions", { method: "POST", body: { proposal_id: proposalId, action_token: actionToken } }), renderAssistantActions);
    });
  });
  document.querySelectorAll("[data-execution-rollback]").forEach((button) => {
    button.addEventListener("click", async () => {
      await submit(() => fetchJson(`/api/v1/executions/${button.dataset.executionRollback}/rollback`, { method: "POST", body: {} }), renderAssistantActions);
    });
  });
}

function bindMemoryButtons() {
  document.querySelectorAll("[data-memory]").forEach((button) => {
    button.addEventListener("click", async () => {
      await submit(() => fetchJson(`/api/v1/memories/${button.dataset.memory}/${button.dataset.action}`, { method: "POST", body: {} }), renderMemory);
    });
  });
  document.querySelectorAll("[data-memory-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      await submit(() => fetchJson(`/api/v1/memories/${button.dataset.memoryDelete}`, { method: "DELETE" }), renderMemory);
    });
  });
  document.querySelectorAll("[data-memory-proposal]").forEach((button) => {
    button.addEventListener("click", async () => {
      await submit(() => fetchJson(`/api/v1/memory/proposals/${button.dataset.memoryProposal}/${button.dataset.decision}`, { method: "POST", body: {} }), renderMemory);
    });
  });
}

function bindAutomationButtons() {
  document.querySelectorAll("[data-automation]").forEach((button) => {
    button.addEventListener("click", async () => {
      await submit(() => fetchJson(`/api/v1/automations/${button.dataset.automation}/${button.dataset.action}`, { method: "POST", body: {} }), renderAutomation);
    });
  });
}

function bindConnectorButtons() {
  document.querySelectorAll("[data-connector]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.action;
      const body = action === "authorize" ? {} : action === "sync" ? { mode: "IMPORT_ONLY" } : {};
      await submit(() => fetchJson(`/api/v1/connectors/${button.dataset.connector}/${action}`, { method: "POST", body }), renderConnectors);
    });
  });
  document.querySelectorAll("[data-sync-conflict]").forEach((button) => {
    button.addEventListener("click", async () => {
      await submit(() => fetchJson(`/api/v1/synchronization-conflicts/${button.dataset.syncConflict}/resolve`, { method: "POST", body: { resolution: button.dataset.resolution } }), renderConnectors);
    });
  });
}

function bindNotebookButtons() {
  document.querySelectorAll("[data-notebook]").forEach((button) => {
    button.addEventListener("click", async () => {
      await submit(() => fetchJson(`/api/v1/notebooks/${button.dataset.notebook}/${button.dataset.action}`, { method: "POST" }), renderNotes);
    });
  });
}

function bindNoteButtons(onSuccess) {
  document.querySelectorAll("[data-note]").forEach((button) => {
    button.addEventListener("click", async () => {
      await submit(() => fetchJson(`/api/v1/notes/${button.dataset.note}/${button.dataset.action}`, { method: "POST", body: {} }), onSuccess);
    });
  });
}

function bindConversationButtons(onSuccess) {
  document.querySelectorAll("[data-conversation]").forEach((button) => {
    button.addEventListener("click", async () => {
      await submit(() => fetchJson(`/api/v1/conversations/${button.dataset.conversation}/${button.dataset.action}`, { method: "POST", body: {} }), onSuccess);
    });
  });
}

function bindMarkdownPreview(inputSelector, previewSelector, draftKey) {
  const input = document.querySelector(inputSelector);
  const preview = document.querySelector(previewSelector);
  input?.addEventListener("input", () => {
    localStorage.setItem(draftKey, input.value);
    preview.innerHTML = markdownPreview(input.value);
  });
}

function markdownPreview(markdown) {
  return `<p>${escapeHtml(markdown)
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replaceAll("\n\n", "</p><p>")
    .replaceAll("\n", "<br>")}</p>`;
}

function splitTags(value) {
  return String(value ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizeDateBody(body, fields) {
  for (const field of fields) {
    if (body[field]) {
      body[field] = new Date(body[field]).toISOString();
    }
  }
  return body;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

window.addEventListener("popstate", route);
boot();
