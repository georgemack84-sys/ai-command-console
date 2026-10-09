type ResearchReportActionEnvelope<T> = {
  ok?: boolean;
  data?: T & { requiresConfirmation?: boolean; output?: unknown };
  error?: string | { message?: string };
};

export async function mutateResearchReport<T>(
  method: "POST" | "PATCH" | "DELETE",
  input: Record<string, unknown>,
  options: { confirmed?: boolean } = {},
): Promise<T> {
  const response = await fetch("/api/research/reports", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, confirmed: options.confirmed === true }),
  });
  const result = (await response.json()) as ResearchReportActionEnvelope<T>;
  const error = typeof result.error === "string" ? result.error : result.error?.message;
  if (!response.ok || !result.ok) {
    throw new Error(error || "Unable to update research reports.");
  }
  if (result.data?.requiresConfirmation && !options.confirmed) {
    const explanation =
      typeof result.data.output === "string"
        ? result.data.output
        : "This research report change requires confirmation.";
    if (typeof window === "undefined" || !window.confirm(explanation)) {
      throw new Error("Research report change cancelled before confirmation.");
    }
    return mutateResearchReport<T>(method, input, { confirmed: true });
  }
  return result.data as T;
}
