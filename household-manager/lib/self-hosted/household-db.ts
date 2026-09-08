import "server-only";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const dataDirectory = join(process.cwd(), ".data");
mkdirSync(dataDirectory, { recursive: true });
const database = new Database(join(dataDirectory, "household-manager.db"));

database.pragma("journal_mode = WAL");
database.exec(`
  create table if not exists chores (
    id text primary key, title text not null, assignee_name text not null,
    cadence text not null, completed integer not null default 0, created_at text not null
  );
  create table if not exists shopping_items (
    id text primary key, title text not null, category text not null,
    purchased integer not null default 0, created_at text not null
  );
  create table if not exists household_location (
    id text primary key, label text not null, city text not null, state text not null,
    postal_code text not null, country text not null, latitude real not null,
    longitude real not null, timezone text not null, created_at text not null, updated_at text not null
  );
  create table if not exists tasks (
    id text primary key, title text not null, completed integer not null default 0,
    created_at text not null
  );
  create table if not exists household_members (
    id text primary key, name text not null unique, created_at text not null
  );
  create table if not exists chore_completions (
    id text primary key, chore_id text not null, completed_at text not null
  );
  create table if not exists bills (
    id text primary key, name text not null, amount real not null,
    due_date text not null, status text not null default 'UNPAID', created_at text not null
  );
  create table if not exists context_insight_history (
    id text primary key, insight_id text not null, event_type text not null,
    title text not null, message text not null, related_entities text not null,
    created_at text not null, unique(insight_id, event_type)
  );
`);

const choreColumns = database.prepare("pragma table_info(chores)").all() as { name: string }[];
if (!choreColumns.some((column) => column.name === "due_day")) database.exec("alter table chores add column due_day text not null default 'Any day'");
if (!choreColumns.some((column) => column.name === "completed_at")) database.exec("alter table chores add column completed_at text");
const taskColumns = database.prepare("pragma table_info(tasks)").all() as { name: string }[];
if (!taskColumns.some((column) => column.name === "due_date")) database.exec("alter table tasks add column due_date text");
if (!taskColumns.some((column) => column.name === "priority")) database.exec("alter table tasks add column priority text not null default 'MEDIUM'");

export type StoredChore = { id: string; title: string; assignee_name: string; cadence: "Weekly" | "Every 2 weeks" | "Monthly"; due_day: string; completed: number; completed_at: string | null; completion_count: number; };
export type StoredShoppingItem = { id: string; title: string; category: string; purchased: number; };
export type StoredLocation = { id: string; label: string; city: string; state: string; postal_code: string; country: string; latitude: number; longitude: number; timezone: string; created_at: string; updated_at: string; };
export type StoredTask = { id: string; title: string; completed: number; due_date: string | null; priority: "LOW" | "MEDIUM" | "HIGH"; };
export type StoredBill = { id: string; name: string; amount: number; due_date: string; status: "UNPAID" | "PAID"; };
export type StoredContextHistory = { id: string; insight_id: string; event_type: "GENERATED" | "DISMISSED" | "RESOLVED"; title: string; message: string; related_entities: string; created_at: string; };
export type HouseholdBackup = { chores: Record<string, unknown>[]; shoppingItems: Record<string, unknown>[]; members: Record<string, unknown>[]; choreCompletions: Record<string, unknown>[]; location: Record<string, unknown>[]; tasks: Record<string, unknown>[]; };

export const selfHostedDb = {
  listChores: () => database.prepare("select c.id, c.title, c.assignee_name, c.cadence, c.due_day, c.completed, c.completed_at, (select count(*) from chore_completions h where h.chore_id = c.id) as completion_count from chores c order by c.created_at").all() as StoredChore[],
  addChore: (id: string, title: string, assignee: string, cadence: StoredChore["cadence"], dueDay: string) => database.prepare("insert into chores (id, title, assignee_name, cadence, due_day, created_at) values (?, ?, ?, ?, ?, ?)").run(id, title, assignee, cadence, dueDay, new Date().toISOString()),
  toggleChore: (id: string) => database.transaction(() => { const chore = database.prepare("select completed from chores where id = ?").get(id) as { completed: number } | undefined; if (!chore) return; if (chore.completed) database.prepare("update chores set completed = 0, completed_at = null where id = ?").run(id); else { const now = new Date().toISOString(); database.prepare("update chores set completed = 1, completed_at = ? where id = ?").run(now, id); database.prepare("insert into chore_completions (id, chore_id, completed_at) values (?, ?, ?)").run(crypto.randomUUID(), id, now); } })(),
  listMembers: () => database.prepare("select id, name from household_members order by name").all() as { id: string; name: string }[],
  addMember: (id: string, name: string) => database.prepare("insert into household_members (id, name, created_at) values (?, ?, ?)").run(id, name, new Date().toISOString()),
  renameMember: (id: string, name: string) => database.transaction(() => { const member = database.prepare("select name from household_members where id = ?").get(id) as { name: string } | undefined; if (!member) return; database.prepare("update household_members set name = ? where id = ?").run(name, id); database.prepare("update chores set assignee_name = ? where assignee_name = ?").run(name, member.name); })(),
  deleteMember: (id: string) => database.transaction(() => { const member = database.prepare("select name from household_members where id = ?").get(id) as { name: string } | undefined; if (!member) return; database.prepare("update chores set assignee_name = 'Unassigned' where assignee_name = ?").run(member.name); database.prepare("delete from household_members where id = ?").run(id); })(),
  updateChore: (id: string, title: string) => database.prepare("update chores set title = ? where id = ?").run(title, id),
  deleteChore: (id: string) => database.transaction(() => { database.prepare("delete from chore_completions where chore_id = ?").run(id); database.prepare("delete from chores where id = ?").run(id); })(),
  updateShopping: (id: string, title: string) => database.prepare("update shopping_items set title = ? where id = ?").run(title, id),
  deleteShopping: (id: string) => database.prepare("delete from shopping_items where id = ?").run(id),
  archivePurchased: () => database.prepare("delete from shopping_items where purchased = 1").run(),
  listShopping: () => database.prepare("select id, title, category, purchased from shopping_items order by created_at").all() as StoredShoppingItem[],
  addShopping: (id: string, title: string, category: string) => database.prepare("insert into shopping_items (id, title, category, created_at) values (?, ?, ?, ?)").run(id, title, category, new Date().toISOString()),
  toggleShopping: (id: string) => database.prepare("update shopping_items set purchased = case purchased when 1 then 0 else 1 end where id = ?").run(id),
  getLocation: () => database.prepare("select * from household_location where id = 'home'").get() as StoredLocation | undefined,
  saveLocation: (location: StoredLocation) => database.prepare("insert into household_location (id, label, city, state, postal_code, country, latitude, longitude, timezone, created_at, updated_at) values (@id, @label, @city, @state, @postal_code, @country, @latitude, @longitude, @timezone, @created_at, @updated_at) on conflict(id) do update set label = excluded.label, city = excluded.city, state = excluded.state, postal_code = excluded.postal_code, country = excluded.country, latitude = excluded.latitude, longitude = excluded.longitude, timezone = excluded.timezone, updated_at = excluded.updated_at").run(location),
  listTasks: () => database.prepare("select id, title, completed, due_date, priority from tasks order by created_at").all() as StoredTask[],
  addTask: (id: string, title: string, dueDate: string | null, priority: StoredTask["priority"]) => database.prepare("insert into tasks (id, title, due_date, priority, created_at) values (?, ?, ?, ?, ?)").run(id, title, dueDate, priority, new Date().toISOString()),
  toggleTask: (id: string) => database.prepare("update tasks set completed = case completed when 1 then 0 else 1 end where id = ?").run(id),
  listBills: () => database.prepare("select id, name, amount, due_date, status from bills order by due_date").all() as StoredBill[],
  addBill: (id: string, name: string, amount: number, dueDate: string) => database.prepare("insert into bills (id, name, amount, due_date, created_at) values (?, ?, ?, ?, ?)").run(id, name, amount, dueDate, new Date().toISOString()),
  toggleBillPaid: (id: string) => database.prepare("update bills set status = case status when 'PAID' then 'UNPAID' else 'PAID' end where id = ?").run(id),
  recordInsightGenerated: (insight: { id: string; title: string; message: string; relatedEntities: string[] }) => database.prepare("insert or ignore into context_insight_history (id, insight_id, event_type, title, message, related_entities, created_at) values (?, ?, 'GENERATED', ?, ?, ?, ?)").run(crypto.randomUUID(), insight.id, insight.title, insight.message, JSON.stringify(insight.relatedEntities), new Date().toISOString()),
  dismissInsight: (insightId: string) => database.prepare("insert or ignore into context_insight_history (id, insight_id, event_type, title, message, related_entities, created_at) select ?, insight_id, 'DISMISSED', title, message, related_entities, ? from context_insight_history where insight_id = ? and event_type = 'GENERATED'").run(crypto.randomUUID(), new Date().toISOString(), insightId),
  resolveInsightsForEntity: (entity: string) => database.prepare("insert or ignore into context_insight_history (id, insight_id, event_type, title, message, related_entities, created_at) select lower(hex(randomblob(16))), insight_id, 'RESOLVED', title, message, related_entities, ? from context_insight_history generated where event_type = 'GENERATED' and related_entities like ?").run(new Date().toISOString(), `%\"${entity}\"%`),
  listDismissedInsightIds: () => database.prepare("select insight_id from context_insight_history where event_type = 'DISMISSED'").all() as { insight_id: string }[],
  listContextHistory: () => database.prepare("select id, insight_id, event_type, title, message, related_entities, created_at from context_insight_history order by created_at desc limit 50").all() as StoredContextHistory[],
  backup: (): HouseholdBackup => ({
    chores: database.prepare("select * from chores").all() as Record<string, unknown>[], shoppingItems: database.prepare("select * from shopping_items").all() as Record<string, unknown>[],
    members: database.prepare("select * from household_members").all() as Record<string, unknown>[], choreCompletions: database.prepare("select * from chore_completions").all() as Record<string, unknown>[],
    location: database.prepare("select * from household_location").all() as Record<string, unknown>[], tasks: database.prepare("select * from tasks").all() as Record<string, unknown>[]
  }),
  restore: (backup: HouseholdBackup) => database.transaction(() => {
    database.exec("delete from chore_completions; delete from chores; delete from shopping_items; delete from household_members; delete from household_location; delete from tasks;");
    const insert = (table: string, columns: string[], row: Record<string, unknown>) => database.prepare(`insert into ${table} (${columns.join(", ")}) values (${columns.map((column) => `@${column}`).join(", ")})`).run(row);
    backup.members.forEach((row) => insert("household_members", ["id", "name", "created_at"], row));
    backup.chores.forEach((row) => insert("chores", ["id", "title", "assignee_name", "cadence", "completed", "created_at", "due_day", "completed_at"], row));
    backup.choreCompletions.forEach((row) => insert("chore_completions", ["id", "chore_id", "completed_at"], row));
    backup.shoppingItems.forEach((row) => insert("shopping_items", ["id", "title", "category", "purchased", "created_at"], row));
    backup.location.forEach((row) => insert("household_location", ["id", "label", "city", "state", "postal_code", "country", "latitude", "longitude", "timezone", "created_at", "updated_at"], row));
    backup.tasks.forEach((row) => insert("tasks", ["id", "title", "completed", "created_at"], row));
  })(),
  health: () => ({ chores: Number((database.prepare("select count(*) as count from chores").get() as { count: number }).count), shoppingItems: Number((database.prepare("select count(*) as count from shopping_items").get() as { count: number }).count), members: Number((database.prepare("select count(*) as count from household_members").get() as { count: number }).count), completedChores: Number((database.prepare("select count(*) as count from chore_completions").get() as { count: number }).count) })
};
