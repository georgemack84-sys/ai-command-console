import { createClient } from "../supabase/client";
import { isSupabaseConfigured } from "../supabase/env";
import { notifyContextChanged } from "../context/client-events";

export type Chore = { id: string; title: string; assignee: string; cadence: "Weekly" | "Every 2 weeks" | "Monthly"; dueDay?: string; completed: boolean; completedAt?: string | null; completionCount?: number; };
export type ShoppingItem = { id: string; title: string; category: string; purchased: boolean; };

const choresKey = "household-manager:chores";
const shoppingKey = "household-manager:shopping";

function read<T>(key: string): T[] { const value = window.localStorage.getItem(key); return value ? (JSON.parse(value) as T[]) : []; }
function write<T>(key: string, items: T[]) { window.localStorage.setItem(key, JSON.stringify(items)); }

export interface HouseholdService {
  listChores(): Promise<Chore[]>;
  addChore(title: string, assignee: string, cadence: Chore["cadence"], dueDay?: string): Promise<Chore[]>;
  toggleChore(id: string): Promise<Chore[]>;
  listShopping(): Promise<ShoppingItem[]>;
  addShopping(title: string, category: string): Promise<ShoppingItem[]>;
  toggleShopping(id: string): Promise<ShoppingItem[]>;
}

class LocalHouseholdService implements HouseholdService {
  async listChores() { return read<Chore>(choresKey); }
  async addChore(title: string, assignee: string, cadence: Chore["cadence"], dueDay = "Any day") { if (!title.trim()) throw new Error("Give the chore a name first."); const next = [...read<Chore>(choresKey), { id: crypto.randomUUID(), title: title.trim(), assignee: assignee.trim() || "Unassigned", cadence, dueDay, completed: false }]; write(choresKey, next); return next; }
  async toggleChore(id: string) { const next = read<Chore>(choresKey).map((chore) => chore.id === id ? { ...chore, completed: !chore.completed } : chore); write(choresKey, next); return next; }
  async listShopping() { return read<ShoppingItem>(shoppingKey); }
  async addShopping(title: string, category: string) { if (!title.trim()) throw new Error("Give the item a name first."); const next = [...read<ShoppingItem>(shoppingKey), { id: crypto.randomUUID(), title: title.trim(), category: category.trim() || "General", purchased: false }]; write(shoppingKey, next); return next; }
  async toggleShopping(id: string) { const next = read<ShoppingItem>(shoppingKey).map((item) => item.id === id ? { ...item, purchased: !item.purchased } : item); write(shoppingKey, next); return next; }
}

class SupabaseHouseholdService implements HouseholdService {
  private async householdId() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sign in to use shared household lists.");
    const { data, error } = await supabase.from("household_members").select("household_id").eq("user_id", user.id).maybeSingle();
    if (error || !data) throw new Error("No household is associated with this account yet.");
    return data.household_id as string;
  }
  private chore(data: Record<string, unknown>): Chore { return { id: data.id as string, title: data.title as string, assignee: data.assignee_name as string, cadence: data.cadence as Chore["cadence"], completed: Boolean(data.completed_at) }; }
  private item(data: Record<string, unknown>): ShoppingItem { return { id: data.id as string, title: data.title as string, category: data.category as string, purchased: Boolean(data.purchased_at) }; }
  async listChores() { const id = await this.householdId(); const { data, error } = await createClient().from("chores").select("*").eq("household_id", id).order("created_at"); if (error) throw new Error("Unable to load chores."); return (data ?? []).map((value) => this.chore(value as Record<string, unknown>)); }
  async addChore(title: string, assignee: string, cadence: Chore["cadence"], dueDay = "Any day") { if (!title.trim()) throw new Error("Give the chore a name first."); const householdId = await this.householdId(); const { error } = await createClient().from("chores").insert({ household_id: householdId, title: title.trim(), assignee_name: assignee.trim() || "Unassigned", cadence, due_day: dueDay }); if (error) throw new Error("Unable to add chore."); notifyContextChanged(); return this.listChores(); }
  async toggleChore(id: string) { const chore = (await this.listChores()).find((value) => value.id === id); if (!chore) return this.listChores(); const { error } = await createClient().from("chores").update({ completed_at: chore.completed ? null : new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id); if (error) throw new Error("Unable to update chore."); notifyContextChanged(); return this.listChores(); }
  async listShopping() { const id = await this.householdId(); const { data, error } = await createClient().from("shopping_items").select("*").eq("household_id", id).order("created_at"); if (error) throw new Error("Unable to load shopping list."); return (data ?? []).map((value) => this.item(value as Record<string, unknown>)); }
  async addShopping(title: string, category: string) { if (!title.trim()) throw new Error("Give the item a name first."); const householdId = await this.householdId(); const { error } = await createClient().from("shopping_items").insert({ household_id: householdId, title: title.trim(), category: category.trim() || "General" }); if (error) throw new Error("Unable to add shopping item."); return this.listShopping(); }
  async toggleShopping(id: string) { const item = (await this.listShopping()).find((value) => value.id === id); if (!item) return this.listShopping(); const { error } = await createClient().from("shopping_items").update({ purchased_at: item.purchased ? null : new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id); if (error) throw new Error("Unable to update shopping item."); return this.listShopping(); }
}

class SelfHostedHouseholdService implements HouseholdService {
  private async request<T>(method: "GET" | "POST" | "PATCH", body?: Record<string, unknown>): Promise<T> {
    const url = method === "GET" ? `/api/household?resource=${body?.resource}` : "/api/household";
    const response = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body && method !== "GET" ? JSON.stringify(body) : undefined });
    if (!response.ok) { const result = await response.json().catch(() => null) as { error?: string } | null; throw new Error(result?.error ?? "Unable to update the household list."); }
    return response.json() as Promise<T>;
  }
  async listChores() { return this.request<Chore[]>("GET", { resource: "chores" }); }
  async addChore(title: string, assignee: string, cadence: Chore["cadence"], dueDay = "Any day") { if (!title.trim()) throw new Error("Give the chore a name first."); return this.request<Chore[]>("POST", { resource: "chores", title, assignee, cadence, dueDay }); }
  async toggleChore(id: string) { return this.request<Chore[]>("PATCH", { resource: "chores", id }); }
  async listShopping() { return this.request<ShoppingItem[]>("GET", { resource: "shopping" }); }
  async addShopping(title: string, category: string) { if (!title.trim()) throw new Error("Give the item a name first."); return this.request<ShoppingItem[]>("POST", { resource: "shopping", title, category }); }
  async toggleShopping(id: string) { return this.request<ShoppingItem[]>("PATCH", { resource: "shopping", id }); }
}

export function createHouseholdService(): HouseholdService {
  const storage = process.env.NEXT_PUBLIC_HOUSEHOLD_STORAGE;
  if (storage === "local") return new LocalHouseholdService();
  if (storage === "supabase" && isSupabaseConfigured()) return new SupabaseHouseholdService();
  return new SelfHostedHouseholdService();
}
