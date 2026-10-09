type OperationsActionResponse = {
  action: string;
  output: unknown;
  requiresConfirmation?: boolean;
};

export async function postOperationsAction(
  action: string,
  payload: Record<string, unknown>,
  options: { confirmed?: boolean } = {},
): Promise<OperationsActionResponse> {
  const response = await fetch("/api/operations/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload, confirmed: Boolean(options.confirmed) }),
  });

  const result = (await response.json()) as {
    ok: boolean;
    data?: OperationsActionResponse;
    error?: string | { message?: string };
  };

  if (!result.ok) {
    const message =
      typeof result.error === "string"
        ? result.error
        : result.error?.message || "Action failed.";
    throw new Error(message);
  }

  const data = result.data ?? { action, output: null };
  if (data.requiresConfirmation && !options.confirmed) {
    const explanation = typeof data.output === "string" ? data.output : "This operation requires confirmation.";
    if (typeof window === "undefined" || !window.confirm(explanation)) {
      throw new Error("Operation cancelled before confirmation.");
    }
    return postOperationsAction(action, payload, { confirmed: true });
  }

  return data;
}
