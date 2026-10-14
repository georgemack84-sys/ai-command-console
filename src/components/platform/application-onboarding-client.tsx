"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, ChevronRight, CircleAlert, ShieldCheck } from "lucide-react";
import { Button, buttonVariants } from "@/src/components/ui/button";
import { SurfacePanel, SurfacePanelHeader } from "@/src/components/ui/surface-panel";

type RegistrationForm = {
  slug: string;
  displayName: string;
  description: string;
  ownerApplicationContact: string;
  supportedContractVersions: string;
  metadata: string;
};

type ValidatedApplication = Omit<RegistrationForm, "supportedContractVersions" | "metadata"> & {
  supportedContractVersions: string[];
  metadata: Record<string, string>;
};

const initialForm: RegistrationForm = {
  slug: "",
  displayName: "",
  description: "",
  ownerApplicationContact: "",
  supportedContractVersions: "1.0",
  metadata: "",
};

function parseMetadata(value: string) {
  if (!value.trim()) return {};
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Metadata must be a JSON object of string values.");
  if (Object.values(parsed).some((entry) => typeof entry !== "string")) throw new Error("Every metadata value must be a string.");
  return parsed as Record<string, string>;
}

function requestPayload(form: RegistrationForm): ValidatedApplication {
  return {
    slug: form.slug.trim().toLowerCase(),
    displayName: form.displayName.trim(),
    description: form.description.trim(),
    ownerApplicationContact: form.ownerApplicationContact.trim(),
    supportedContractVersions: form.supportedContractVersions.split(",").map((value) => value.trim()).filter(Boolean),
    metadata: parseMetadata(form.metadata),
  };
}

export function ApplicationOnboardingClient() {
  const [form, setForm] = useState(initialForm);
  const [validated, setValidated] = useState<ValidatedApplication | null>(null);
  const [busy, setBusy] = useState<"validate" | "register" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [registeredId, setRegisteredId] = useState<string | null>(null);

  const steps = useMemo(() => [
    { label: "Describe", complete: Boolean(form.slug && form.displayName && form.description && form.ownerApplicationContact) },
    { label: "Validate", complete: Boolean(validated) },
    { label: "Register", complete: Boolean(registeredId) },
  ], [form, registeredId, validated]);

  function update<K extends keyof RegistrationForm>(key: K, value: RegistrationForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setValidated(null);
    setRegisteredId(null);
  }

  async function validate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("validate");
    setError(null);
    setMessage(null);
    try {
      const payload = requestPayload(form);
      const response = await fetch("/api/platform/applications/validate", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
      });
      const body = await response.json() as { ok?: boolean; data?: { application?: ValidatedApplication }; error?: { message?: string } };
      if (!response.ok || !body.ok || !body.data?.application) throw new Error(body.error?.message ?? "Application configuration could not be validated.");
      setValidated(body.data.application);
      setMessage("Configuration is ready. Registration will create a draft application only.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Application configuration could not be validated.");
    } finally {
      setBusy(null);
    }
  }

  async function register() {
    if (!validated) return;
    setBusy("register");
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/platform/applications", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(validated),
      });
      const body = await response.json() as { ok?: boolean; data?: { application?: { applicationId?: string }; created?: boolean }; error?: { message?: string } };
      if (!response.ok || !body.ok || !body.data?.application?.applicationId) throw new Error(body.error?.message ?? "Application could not be registered.");
      setRegisteredId(body.data.application.applicationId);
      setMessage(body.data.created ? "Draft application registered. Continue to identities and credentials in milestone 5.3." : "This matching application was already registered.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Application could not be registered.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Application Center</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-white">Register an application</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Create the identity and contract record that lets an independent application begin its Proprium integration. This flow cannot issue credentials or grant access.</p>
        </div>
        <Link href="/platform" className={buttonVariants({ variant: "outline" })}>Back to platform</Link>
      </div>

      <ol className="grid gap-3 sm:grid-cols-3" aria-label="Onboarding progress">
        {steps.map((step, index) => <li key={step.label} className={`rounded-2xl border p-4 ${step.complete ? "border-emerald-300/25 bg-emerald-300/10" : "border-white/10 bg-white/[0.04]"}`}>
          <div className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white">{step.complete ? <CheckCircle2 className="h-4 w-4 text-emerald-200" /> : index + 1}</span><span className="text-sm font-medium text-white">{step.label}</span></div>
        </li>)}
      </ol>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SurfacePanel>
          <SurfacePanelHeader badge="Step 1" title="Application profile" description="All fields become a validated registry contract. Credentials and permissions are intentionally absent." />
          <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={validate}>
            <Field label="Application name" value={form.displayName} onChange={(value) => update("displayName", value)} placeholder="Nuru" required />
            <Field label="Stable slug" value={form.slug} onChange={(value) => update("slug", value)} placeholder="nuru" hint="Lowercase letters, numbers, hyphens." required />
            <label className="space-y-2 sm:col-span-2"><span className="text-sm text-slate-200">Description</span><textarea required value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Knowledge and evidence application." className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-sky-300/50" /></label>
            <Field label="Operational contact" type="email" value={form.ownerApplicationContact} onChange={(value) => update("ownerApplicationContact", value)} placeholder="team@example.com" required />
            <Field label="Contract versions" value={form.supportedContractVersions} onChange={(value) => update("supportedContractVersions", value)} placeholder="1.0" hint="Comma-separated major.minor versions." required />
            <label className="space-y-2 sm:col-span-2"><span className="text-sm text-slate-200">Non-secret metadata <span className="text-slate-500">optional</span></span><textarea value={form.metadata} onChange={(event) => update("metadata", event.target.value)} placeholder={'{\n  "domain": "knowledge"\n}'} className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 font-mono text-sm text-white outline-none focus:border-sky-300/50" /><span className="text-xs text-slate-500">A small JSON object of string values. Never include secrets, credentials, or user data.</span></label>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2"><Button type="submit" disabled={busy !== null}>{busy === "validate" ? "Validating…" : "Validate configuration"}<ChevronRight className="h-4 w-4" /></Button>{validated ? <span className="text-sm text-emerald-200">Ready for registration</span> : null}</div>
          </form>
        </SurfacePanel>

        <div className="space-y-4">
          <SurfacePanel>
            <SurfacePanelHeader badge="Step 2" title="Registration review" description={validated ? "The server validated this configuration." : "Validate the profile to unlock registration."} />
            {validated ? <div className="mt-5 space-y-3 text-sm"><ReviewRow label="Application" value={validated.displayName} /><ReviewRow label="Slug" value={validated.slug} /><ReviewRow label="Contracts" value={validated.supportedContractVersions.join(", ")} /><ReviewRow label="Initial state" value="DRAFT" /><Button className="mt-3 w-full" onClick={() => void register()} disabled={busy !== null || Boolean(registeredId)}>{busy === "register" ? "Registering…" : registeredId ? "Registered" : "Register draft application"}</Button></div> : <p className="mt-5 text-sm text-slate-400">No validated configuration yet.</p>}
          </SurfacePanel>
          <SurfacePanel className="border-amber-300/15 bg-amber-300/[0.04]"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-100" /><div><p className="text-sm font-medium text-amber-50">Registration is not authorization</p><p className="mt-1 text-sm leading-6 text-amber-100/70">This creates an administrative record only. Service credentials, capabilities, permissions, and protected execution each require later governed steps.</p></div></div></SurfacePanel>
        </div>
      </div>

      {message ? <p role="status" className="flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100"><CheckCircle2 className="h-4 w-4" />{message}</p> : null}
      {error ? <p role="alert" className="flex items-center gap-2 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100"><CircleAlert className="h-4 w-4" />{error}</p> : null}
    </div>
  );
}

function Field({ label, hint, value, onChange, placeholder, type = "text", required = false }: Readonly<{ label: string; hint?: string; value: string; onChange(value: string): void; placeholder: string; type?: string; required?: boolean }>) {
  return <label className="space-y-2"><span className="text-sm text-slate-200">{label}</span><input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-sky-300/50" />{hint ? <span className="text-xs text-slate-500">{hint}</span> : null}</label>;
}

function ReviewRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3 last:border-0"><span className="text-slate-400">{label}</span><span className="text-right text-white">{value}</span></div>;
}
