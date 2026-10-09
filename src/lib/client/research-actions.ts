type ResearchActionResponse = {
  action: string;
  output: unknown;
  requiresConfirmation?: boolean;
};

export async function postResearchAction(
  action: string,
  payload: Record<string, unknown>,
  options: { confirmed?: boolean } = {},
): Promise<ResearchActionResponse | undefined> {
  const response = await fetch("/api/research/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload, confirmed: Boolean(options.confirmed) }),
  });

  const result = (await response.json()) as {
    ok: boolean;
    data?: ResearchActionResponse;
    error?: string | { message?: string };
  };

  if (!result.ok) {
    const message = typeof result.error === "string" ? result.error : result.error?.message || "Action failed.";
    throw new Error(message);
  }

  if (result.data?.requiresConfirmation && !options.confirmed) {
    const explanation = typeof result.data.output === "string" ? result.data.output : "This research action requires confirmation.";
    if (typeof window === "undefined" || !window.confirm(explanation)) {
      throw new Error("Research action cancelled before confirmation.");
    }
    return postResearchAction(action, payload, { confirmed: true });
  }

  return result.data;
}
