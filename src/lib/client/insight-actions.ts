type InsightActionEnvelope<T> = {
  ok?: boolean;
  data?: T & { requiresConfirmation?: boolean; output?: unknown };
  error?: string | { message?: string };
};

export async function postInsightGenerationAction<T>(
  input: { async?: boolean },
  options: { confirmed?: boolean } = {},
): Promise<T> {
  const response = await fetch("/api/insights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, confirmed: options.confirmed === true }),
  });
  const result = (await response.json()) as InsightActionEnvelope<T>;
  const error = typeof result.error === "string" ? result.error : result.error?.message;
  if (!response.ok || !result.ok || !result.data) {
    throw new Error(error || "Unable to generate insights.");
  }
  if (result.data.requiresConfirmation && !options.confirmed) {
    const explanation =
      typeof result.data.output === "string"
        ? result.data.output
        : "Insight generation requires confirmation.";
    if (typeof window === "undefined" || !window.confirm(explanation)) {
      throw new Error("Insight generation cancelled before confirmation.");
    }
    return postInsightGenerationAction<T>(input, { confirmed: true });
  }
  return result.data;
}
