export type PropriumBill = { id: string; householdId: string; name: string; amount: number; dueDate: string; notes: string | null; paymentStatus: "Unpaid" | "Paid"; updatedAtUtc: string };

export function propriumBillSource() {
  const origin = process.env.NEXT_PUBLIC_PROPRIUM_API_ORIGIN?.replace(/\/$/, "");
  const householdId = process.env.NEXT_PUBLIC_PROPRIUM_HOUSEHOLD_ID;
  return origin && householdId ? { origin, householdId } : null;
}

export async function listPropriumBills(): Promise<PropriumBill[]> {
  const source = propriumBillSource();
  if (!source) throw new Error("Proprium Bills are not configured.");
  const response = await fetch(`${source.origin}/api/v1/households/${source.householdId}/bills`, { credentials: "include", cache: "no-store" });
  if (!response.ok) throw new Error(response.status === 401 ? "Sign in to Proprium to view Bills." : "Unable to load Proprium Bills.");
  return response.json() as Promise<PropriumBill[]>;
}

export async function createPropriumBill(input: { name: string; amount: number; dueDate: string; notes?: string | null }): Promise<PropriumBill> {
  return request<PropriumBill>("", "POST", input);
}

export async function setPropriumBillPaymentStatus(billId: string, paymentStatus: "Paid" | "Unpaid"): Promise<PropriumBill> {
  return request<PropriumBill>(`/${billId}/payment-status`, "PATCH", { paymentStatus });
}

async function request<T>(path: string, method: "POST" | "PATCH", body: object): Promise<T> {
  const source = propriumBillSource();
  if (!source) throw new Error("Proprium Bills are not configured.");
  const response = await fetch(`${source.origin}/api/v1/households/${source.householdId}/bills${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-Proprium-CSRF": "1" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("Sign in to Proprium to manage Bills.");
    if (response.status === 403) throw new Error("Your Proprium account does not have access to this household's Bills.");
    throw new Error("Unable to update Proprium Bills. Please try again.");
  }
  return response.json() as Promise<T>;
}
