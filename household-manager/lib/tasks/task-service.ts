import { createClient } from "../supabase/client";
import { isSupabaseConfigured } from "../supabase/env";
import { notifyContextChanged } from "../context/client-events";

export type TaskEnvironment = "INDOOR" | "OUTDOOR" | "EITHER";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type HouseholdTask = {
  id: string;
  title: string;
  environment: TaskEnvironment;
  weatherSensitive: boolean;
  minimumTemperatureF: number;
  maximumWindMph: number;
  completed: boolean;
  dueDate?: string | null;
  priority: TaskPriority;
};

const taskKey = "household-manager:tasks";

export class LocalTaskService implements TaskService {
  async list(): Promise<HouseholdTask[]> {
    const stored = window.localStorage.getItem(taskKey);
    return stored ? (JSON.parse(stored) as HouseholdTask[]) : [];
  }

  async create(title: string, options: Pick<HouseholdTask, "dueDate" | "priority"> = { dueDate: null, priority: "MEDIUM" }): Promise<HouseholdTask> {
    if (!title.trim()) throw new Error("Give the task a name first.");
    const tasks = await this.list();
    const task: HouseholdTask = {
      id: crypto.randomUUID(), title: title.trim(), environment: "OUTDOOR", weatherSensitive: true,
      minimumTemperatureF: 45, maximumWindMph: 20, completed: false, dueDate: options.dueDate, priority: options.priority
    };
    window.localStorage.setItem(taskKey, JSON.stringify([...tasks, task]));
    return task;
  }

  async toggle(id: string): Promise<HouseholdTask[]> {
    const tasks = await this.list();
    const next = tasks.map((task) => task.id === id ? { ...task, completed: !task.completed } : task);
    window.localStorage.setItem(taskKey, JSON.stringify(next));
    return next;
  }
}

export interface TaskService {
  list(): Promise<HouseholdTask[]>;
  create(title: string, options?: Pick<HouseholdTask, "dueDate" | "priority">): Promise<HouseholdTask>;
  toggle(id: string): Promise<HouseholdTask[]>;
}

class SelfHostedTaskService implements TaskService {
  private async request<T>(method: "GET" | "POST" | "PATCH", body?: Record<string, unknown>): Promise<T> {
    const url = method === "GET" ? "/api/household?resource=tasks" : "/api/household";
    const response = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body && method !== "GET" ? JSON.stringify(body) : undefined });
    const result = await response.json() as T & { error?: string };
    if (!response.ok) throw new Error(result.error ?? "Unable to update household tasks.");
    return result;
  }
  async list() { return this.request<HouseholdTask[]>("GET", { resource: "tasks" }); }
  async create(title: string, options: Pick<HouseholdTask, "dueDate" | "priority"> = { dueDate: null, priority: "MEDIUM" }) { if (!title.trim()) throw new Error("Give the task a name first."); const tasks = await this.request<HouseholdTask[]>("POST", { resource: "tasks", title, ...options }); return tasks[tasks.length - 1]; }
  async toggle(id: string) { return this.request<HouseholdTask[]>("PATCH", { resource: "tasks", id }); }
}

class SupabaseTaskService implements TaskService {
  private async householdId(): Promise<string> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sign in to save household data.");
    const { data, error } = await supabase.from("household_members").select("household_id").eq("user_id", user.id).maybeSingle();
    if (error || !data) throw new Error("No household is associated with this account yet.");
    return data.household_id as string;
  }

  private map(data: Record<string, unknown>): HouseholdTask {
    return { id: data.id as string, title: data.title as string, environment: data.environment as TaskEnvironment, weatherSensitive: data.weather_sensitive as boolean, minimumTemperatureF: Number(data.minimum_temperature_f ?? 45), maximumWindMph: Number(data.maximum_wind_mph ?? 20), completed: Boolean(data.completed_at), dueDate: data.due_date as string | null, priority: (data.priority as TaskPriority) ?? "MEDIUM" };
  }

  async list(): Promise<HouseholdTask[]> {
    const householdId = await this.householdId();
    const { data, error } = await createClient().from("tasks").select("*").eq("household_id", householdId).order("created_at");
    if (error) throw new Error("Unable to load tasks.");
    return (data ?? []).map((task) => this.map(task as Record<string, unknown>));
  }

  async create(title: string, options: Pick<HouseholdTask, "dueDate" | "priority"> = { dueDate: null, priority: "MEDIUM" }): Promise<HouseholdTask> {
    if (!title.trim()) throw new Error("Give the task a name first.");
    const householdId = await this.householdId();
    const { data, error } = await createClient().from("tasks").insert({ household_id: householdId, title: title.trim(), environment: "OUTDOOR", weather_sensitive: true, minimum_temperature_f: 45, maximum_wind_mph: 20, due_date: options.dueDate, priority: options.priority }).select().single();
    if (error) throw new Error("Unable to add the task.");
    notifyContextChanged();
    return this.map(data as Record<string, unknown>);
  }

  async toggle(id: string): Promise<HouseholdTask[]> {
    const tasks = await this.list();
    const task = tasks.find((candidate) => candidate.id === id);
    if (!task) return tasks;
    const { error } = await createClient().from("tasks").update({ completed_at: task.completed ? null : new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw new Error("Unable to update the task.");
    notifyContextChanged();
    return this.list();
  }
}

export function createTaskService(): TaskService {
  const storage = process.env.NEXT_PUBLIC_HOUSEHOLD_STORAGE;
  if (storage === "local") return new LocalTaskService();
  if (storage === "supabase" && isSupabaseConfigured()) return new SupabaseTaskService();
  return new SelfHostedTaskService();
}
