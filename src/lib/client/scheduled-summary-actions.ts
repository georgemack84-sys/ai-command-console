type ScheduledSummaryActionResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
  status: number;
};

type ScheduledSummaryActionEnvelope<T> = {
  ok?: boolean;
  data?: T & { requiresConfirmation?: boolean; output?: unknown };
  error?: string | { message?: string };
};

export async function postScheduledSummaryAction<T>(
  input: Record<string, unknown>,
  options: { confirmed?: boolean } = {},
): Promise<ScheduledSummaryActionResult<T>> {
  const response = await fetch("/api/research/summaries/run-due", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, confirmed: options.confirmed === true }),
  });
  const result = (await response.json()) as ScheduledSummaryActionEnvelope<T>;
  const error = typeof result.error === "string" ? result.error : result.error?.message;
  if (!response.ok || !result.ok) {
    return { ok: false, error: error || "Unable to run scheduled summary.", status: response.status };
  }
  if (result.data?.requiresConfirmation && !options.confirmed) {
    const explanation =
      typeof result.data.output === "string"
        ? result.data.output
        : "Running this scheduled summary requires confirmation.";
    if (typeof window === "undefined" || !window.confirm(explanation)) {
      return { ok: false, error: "Scheduled summary cancelled before confirmation.", status: 409 };
    }
    return postScheduledSummaryAction<T>(input, { confirmed: true });
  }
  return { ok: true, data: result.data, status: response.status };
}
