type AdminAccessMutationResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
  status: number;
};

type AdminAccessApiEnvelope<T> = {
  ok?: boolean;
  data?: T & {
    requiresConfirmation?: boolean;
    output?: unknown;
  };
  error?: string | { message?: string };
};

export async function patchAdminAccess<T>(
  input: Record<string, unknown>,
  options: { confirmed?: boolean } = {},
): Promise<AdminAccessMutationResult<T>> {
  const response = await fetch("/api/admin/access", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, confirmed: options.confirmed === true }),
  });
  const result = (await response.json()) as AdminAccessApiEnvelope<T>;
  const error = typeof result.error === "string" ? result.error : result.error?.message;

  if (!response.ok || !result.ok) {
    return { ok: false, error: error || "Unable to apply admin update.", status: response.status };
  }

  if (result.data?.requiresConfirmation && !options.confirmed) {
    const explanation =
      typeof result.data.output === "string" ? result.data.output : "This admin action requires confirmation.";
    if (typeof window === "undefined" || !window.confirm(explanation)) {
      return { ok: false, error: "Admin action cancelled before confirmation.", status: 409 };
    }
    return patchAdminAccess<T>(input, { confirmed: true });
  }

  return { ok: true, data: result.data, status: response.status };
}
