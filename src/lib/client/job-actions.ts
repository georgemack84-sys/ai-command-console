type JobActionResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
  status: number;
};

type JobActionEnvelope<T> = {
  ok?: boolean;
  data?: T & { requiresConfirmation?: boolean; output?: unknown };
  error?: string | { message?: string };
};

export async function postJobAction<T>(
  input: Record<string, unknown>,
  options: { confirmed?: boolean } = {},
): Promise<JobActionResult<T>> {
  const response = await fetch("/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, confirmed: options.confirmed === true }),
  });
  const result = (await response.json()) as JobActionEnvelope<T>;
  const error = typeof result.error === "string" ? result.error : result.error?.message;
  if (!response.ok || !result.ok) {
    return { ok: false, error: error || "Unable to manage job.", status: response.status };
  }
  if (result.data?.requiresConfirmation && !options.confirmed) {
    const explanation = typeof result.data.output === "string" ? result.data.output : "This job action requires confirmation.";
    if (typeof window === "undefined" || !window.confirm(explanation)) {
      return { ok: false, error: "Job action cancelled before confirmation.", status: 409 };
    }
    return postJobAction<T>(input, { confirmed: true });
  }
  return { ok: true, data: result.data, status: response.status };
}
