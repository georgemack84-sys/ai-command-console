export async function postDashboardAction(action: string, payload: Record<string, unknown>) {
  const response = await fetch("/api/dashboard/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });

  const result = (await response.json()) as {
    ok: boolean;
    data?: { action: string; output: string | null };
    error?: string | { message?: string };
  };

  if (!result.ok) {
    const message = typeof result.error === "string" ? result.error : result.error?.message || "Action failed.";
    throw new Error(message);
  }

  return result.data;
}
