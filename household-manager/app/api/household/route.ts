import { selfHostedDb, type HouseholdBackup, type StoredLocation } from "../../../lib/self-hosted/household-db";
import { requireHouseholdAccess } from "../../../lib/self-hosted/access";
import { invalidateHouseholdContext } from "../../../lib/context/context-engine";
import { publishContextInvalidated } from "../../../lib/context/context-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cadences = ["Weekly", "Every 2 weeks", "Monthly"] as const;
type Resource = "chores" | "shopping" | "location" | "tasks" | "members" | "bills" | "backup" | "health";

function validText(value: unknown, fallback?: string, max = 240) { if (typeof value !== "string") return fallback; const text = value.trim(); return text.length && text.length <= max ? text : fallback; }
function validNumber(value: unknown, minimum: number, maximum: number) { const number = Number(value); return Number.isFinite(number) && number >= minimum && number <= maximum ? number : null; }
function list(resource: Exclude<Resource, "location">) {
  if (resource === "chores") return selfHostedDb.listChores().map((chore) => ({ id: chore.id, title: chore.title, assignee: chore.assignee_name, cadence: chore.cadence, dueDay: chore.due_day, completed: Boolean(chore.completed), completedAt: chore.completed_at, completionCount: chore.completion_count }));
  if (resource === "shopping") return selfHostedDb.listShopping().map((item) => ({ id: item.id, title: item.title, category: item.category, purchased: Boolean(item.purchased) }));
  if (resource === "members") return selfHostedDb.listMembers();
  if (resource === "bills") return selfHostedDb.listBills().map((bill) => ({ id: bill.id, name: bill.name, amount: bill.amount, dueDate: bill.due_date, status: bill.status }));
  return selfHostedDb.listTasks().map((task) => ({ id: task.id, title: task.title, environment: "OUTDOOR", weatherSensitive: true, minimumTemperatureF: 45, maximumWindMph: 20, completed: Boolean(task.completed), dueDate: task.due_date, priority: task.priority }));
}
function contextChanged() { invalidateHouseholdContext(); publishContextInvalidated(); }
function recordResolvedInsights(resource: "bills" | "tasks" | "chores", id: string) {
  if (resource === "bills" && selfHostedDb.listBills().find((bill) => bill.id === id)?.status === "PAID") selfHostedDb.resolveInsightsForEntity(`bill:${id}`);
  if (resource === "tasks" && selfHostedDb.listTasks().find((task) => task.id === id)?.completed) selfHostedDb.resolveInsightsForEntity(`task:${id}`);
  if (resource === "chores" && selfHostedDb.listChores().find((chore) => chore.id === id)?.completed) selfHostedDb.resolveInsightsForEntity(`task:chore:${id}`);
}

export async function GET(request: Request) {
  const unauthorized = requireHouseholdAccess(request); if (unauthorized) return unauthorized;
  const resource = new URL(request.url).searchParams.get("resource") as Resource | null;
  if (resource === "backup") return Response.json({ version: 1, createdAt: new Date().toISOString(), data: selfHostedDb.backup() }, { headers: { "Content-Disposition": "attachment; filename=household-manager-backup.json" } });
  if (resource === "health") return Response.json({ storage: "SQLite", ...selfHostedDb.health() });
  if (resource === "location") return Response.json(selfHostedDb.getLocation() ?? null);
  if (resource !== "chores" && resource !== "shopping" && resource !== "tasks" && resource !== "members" && resource !== "bills") return Response.json({ error: "Unknown resource." }, { status: 400 });
  return Response.json(list(resource));
}

export async function POST(request: Request) {
  const unauthorized = requireHouseholdAccess(request); if (unauthorized) return unauthorized;
  const body = await request.json() as Record<string, unknown>;
  const resource = body.resource as Resource;
  if (resource === "backup" && body.action === "restore") {
    const snapshot = body.snapshot as { version?: unknown; data?: unknown } | undefined;
    const data = snapshot?.data as HouseholdBackup | undefined;
    if (snapshot?.version !== 1 || !data || ![data.chores, data.shoppingItems, data.members, data.choreCompletions, data.location, data.tasks].every(Array.isArray)) return Response.json({ error: "This backup file is not valid for Household Manager." }, { status: 400 });
    selfHostedDb.restore(data); contextChanged(); return Response.json({ restored: true, ...selfHostedDb.health() });
  }
  if (resource === "location") {
    const label = validText(body.label, undefined, 120), city = validText(body.city, undefined, 120), state = validText(body.state, undefined, 120), country = validText(body.country, undefined, 120), timezone = validText(body.timezone, undefined, 100), latitude = validNumber(body.latitude, -90, 90), longitude = validNumber(body.longitude, -180, 180);
    if (!label || !city || !state || !country || !timezone || latitude === null || longitude === null) return Response.json({ error: "A complete household location is required." }, { status: 400 });
    const existing = selfHostedDb.getLocation(); const now = new Date().toISOString();
    const location: StoredLocation = { id: "home", label, city, state, postal_code: validText(body.postalCode, "", 40)!, country, latitude, longitude, timezone, created_at: existing?.created_at ?? now, updated_at: now };
    selfHostedDb.saveLocation(location); contextChanged(); return Response.json(location);
  }
  if (resource === "bills") {
    const name = validText(body.name, undefined, 120); const amount = validNumber(body.amount, 0, 1_000_000); const dueDate = validText(body.dueDate, undefined, 10);
    if (!name || amount === null || !dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return Response.json({ error: "A bill needs a name, amount, and due date." }, { status: 400 });
    selfHostedDb.addBill(crypto.randomUUID(), name, amount, dueDate); contextChanged(); return Response.json(list("bills"));
  }
  const title = validText(body.title);
  if ((resource !== "chores" && resource !== "shopping" && resource !== "tasks" && resource !== "members") || !title) return Response.json({ error: "A valid item name is required." }, { status: 400 });
  const id = crypto.randomUUID();
  if (resource === "chores") { const cadence = body.cadence; if (!cadences.includes(cadence as (typeof cadences)[number])) return Response.json({ error: "A valid cadence is required." }, { status: 400 }); selfHostedDb.addChore(id, title, validText(body.assignee, "Unassigned", 120)!, cadence as (typeof cadences)[number], validText(body.dueDay, "Any day", 20)!); }
  else if (resource === "shopping") selfHostedDb.addShopping(id, title, validText(body.category, "General", 120)!);
  else if (resource === "members") { try { selfHostedDb.addMember(id, title); } catch { return Response.json({ error: "That household member already exists." }, { status: 409 }); } }
  else { const dueDate = validText(body.dueDate, "", 10); const priority = body.priority; if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return Response.json({ error: "A due date must use YYYY-MM-DD." }, { status: 400 }); if (priority !== "LOW" && priority !== "MEDIUM" && priority !== "HIGH") return Response.json({ error: "A valid priority is required." }, { status: 400 }); selfHostedDb.addTask(id, title, dueDate || null, priority); }
  contextChanged(); return Response.json(list(resource));
}

export async function PATCH(request: Request) {
  const unauthorized = requireHouseholdAccess(request); if (unauthorized) return unauthorized;
  const body = await request.json() as Record<string, unknown>; const resource = body.resource as Resource; const id = validText(body.id); const action = body.action;
  if (resource === "members" && id) { const name = validText(body.name, undefined, 120); try { if (action === "rename" && name) selfHostedDb.renameMember(id, name); else if (action === "delete") selfHostedDb.deleteMember(id); else return Response.json({ error: "A valid member action is required." }, { status: 400 }); contextChanged(); return Response.json(list("members")); } catch { return Response.json({ error: "That household member already exists." }, { status: 409 }); } }
  if (resource === "shopping" && action === "archive") { selfHostedDb.archivePurchased(); contextChanged(); return Response.json(list("shopping")); }
  if (resource === "bills" && id) { selfHostedDb.toggleBillPaid(id); recordResolvedInsights("bills", id); contextChanged(); return Response.json(list("bills")); }
  if ((resource !== "chores" && resource !== "shopping" && resource !== "tasks") || !id) return Response.json({ error: "A valid item is required." }, { status: 400 });
  const title = validText(body.title);
  if (action === "delete") { if (resource === "chores") selfHostedDb.deleteChore(id); else if (resource === "shopping") selfHostedDb.deleteShopping(id); contextChanged(); return Response.json(list(resource)); }
  if (action === "rename" && title) { if (resource === "chores") selfHostedDb.updateChore(id, title); else if (resource === "shopping") selfHostedDb.updateShopping(id, title); else return Response.json({ error: "Tasks cannot be renamed here." }, { status: 400 }); contextChanged(); return Response.json(list(resource)); }
  if (resource === "chores") { selfHostedDb.toggleChore(id); recordResolvedInsights("chores", id); } else if (resource === "shopping") selfHostedDb.toggleShopping(id); else { selfHostedDb.toggleTask(id); recordResolvedInsights("tasks", id); }
  contextChanged(); return Response.json(list(resource));
}
