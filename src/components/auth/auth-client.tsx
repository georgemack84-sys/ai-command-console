"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SectionCard } from "@/src/components/shared/section-card";

type Mode = "login" | "signup";

export function AuthClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite") || "";
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [databaseState, setDatabaseState] = useState<{ ready: boolean; message: string | null }>({
    ready: true,
    message: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadReadiness() {
      try {
        const response = await fetch("/api/ready", { cache: "no-store" });
        const payload = (await response.json()) as {
          ok?: boolean;
          data?: {
            ok?: boolean;
            checks?: {
              database?: {
                details?: string | null;
              };
            };
          };
        };

        if (cancelled) {
          return;
        }

        if (!payload.data?.ok) {
          setDatabaseState({
            ready: false,
            message: payload.data?.checks?.database?.details || "Database is unavailable. Start Postgres and try again.",
          });
          return;
        }

        setDatabaseState({ ready: true, message: null });
      } catch {
        if (!cancelled) {
          setDatabaseState({
            ready: false,
            message: "Database status is unavailable. Start Postgres and try again.",
          });
        }
      }
    }

    void loadReadiness();

    return () => {
      cancelled = true;
    };
  }, []);

  async function submit() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, inviteToken }),
      });
      const payload = (await response.json()) as
        | { ok: true; data: { user: { id: string } } }
        | { ok: false; error?: { message?: string } };

      if (!response.ok || !payload.ok) {
        setError(payload.ok ? "Authentication failed." : payload.error?.message || "Authentication failed.");
        return;
      }

      router.push(searchParams.get("next") || "/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <SectionCard
        eyebrow="Account"
        title="Sign in to access the AI Command Console"
        description="Authentication is environment-aware: the production posture expects a managed secret, secure cookies, and SQLite-backed account storage."
      >
        <div className="mb-5 flex gap-2 rounded-full border border-white/10 bg-white/5 p-1">
          {(["login", "signup"] as Mode[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`flex-1 rounded-full px-4 py-3 text-sm font-medium transition ${
                mode === value ? "bg-sky-300 text-slate-950" : "text-slate-300"
              }`}
            >
              {value === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {!databaseState.ready ? (
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
              Local database is unavailable. Start Postgres, then retry auth.
            </div>
          ) : null}
          {mode === "signup" && inviteToken ? (
            <div className="rounded-2xl border border-sky-300/20 bg-sky-300/10 px-4 py-3 text-sm text-sky-100">
              Workspace invite detected. Creating this account will join the invited workspace automatically.
            </div>
          ) : null}
          {mode === "signup" ? (
            <Field label="Name" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
          ) : null}
          <Field label="Email" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} />
          <Field
            label="Password"
            type="password"
            value={form.password}
            onChange={(value) => setForm((current) => ({ ...current, password: value }))}
          />
        </div>

        {error ? <p className="mt-4 text-sm text-rose-200">{error}</p> : null}
        {!error && !databaseState.ready && databaseState.message ? <p className="mt-4 text-sm text-amber-100/80">{databaseState.message}</p> : null}

        <button
          type="button"
          onClick={() => void submit()}
          disabled={loading || !databaseState.ready}
          className="mt-5 w-full rounded-2xl bg-sky-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200"
        >
          {loading ? "Working..." : !databaseState.ready ? "Database unavailable" : mode === "login" ? "Log in" : "Create account"}
        </button>
      </SectionCard>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-white">{label}</span>
      <input
        suppressHydrationWarning
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
      />
    </label>
  );
}
