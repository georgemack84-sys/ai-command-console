type DashboardActionResponse = {
  action: string;
  output: string | null;
  requiresConfirmation?: boolean;
};

export async function postDashboardAction(
  action: string,
  payload: Record<string, unknown>,
  options: { confirmed?: boolean } = {},
): Promise<DashboardActionResponse | undefined> {
  const response = await fetch("/api/dashboard/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload, confirmed: options.confirmed === true }),
  });

  const result = (await response.json()) as {
    ok: boolean;
    data?: DashboardActionResponse;
    error?: string | { message?: string };
  };

  if (!result.ok) {
    const message = typeof result.error === "string" ? result.error : result.error?.message || "Action failed.";
    throw new Error(message);
  }

  if (result.data?.requiresConfirmation && !options.confirmed) {
    const explanation =
      typeof result.data.output === "string" ? result.data.output : "This dashboard action requires confirmation.";
    if (typeof window === "undefined" || !window.confirm(explanation)) {
      throw new Error("Dashboard action cancelled before confirmation.");
    }
    return postDashboardAction(action, payload, { confirmed: true });
  }

  return result.data;
}
