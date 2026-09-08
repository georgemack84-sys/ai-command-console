export type HouseholdMember = { id: string; name: string; };

async function request<T>(method: "GET" | "POST" | "PATCH", body?: Record<string, unknown>): Promise<T> {
  const response = await fetch(method === "GET" ? "/api/household?resource=members" : "/api/household", { method, headers: method !== "GET" ? { "Content-Type": "application/json" } : undefined, body: method !== "GET" ? JSON.stringify(body) : undefined });
  const result = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(result.error ?? "Unable to update household members.");
  return result;
}

export const memberService = {
  list: () => request<HouseholdMember[]>("GET", { resource: "members" }),
  add: (name: string) => { if (!name.trim()) return Promise.reject(new Error("Give the household member a name first.")); return request<HouseholdMember[]>("POST", { resource: "members", title: name }); },
  rename: (id: string, name: string) => request<HouseholdMember[]>("PATCH", { resource: "members", action: "rename", id, name }),
  remove: (id: string) => request<HouseholdMember[]>("PATCH", { resource: "members", action: "delete", id })
};
