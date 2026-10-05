"use client";

import { useEffect, useState } from "react";
import { canonicalizeNuruAuditPayload } from "@/src/tandem/nuru-audit-integrity";

type Verification = { valid: boolean; message: string; expected?: string; computed?: string; signature?: "verified" | "unsigned" };

function toHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromBase64(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapAuditExport(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error("The audit export must be a JSON object.");

  // The authenticated API consistently returns { ok: true, data: export }.
  // Accept the raw export too, so downloaded and copied records are both verifiable.
  return value.ok === true && isRecord(value.data) ? value.data : value;
}

async function verifyAuditExport(value: string): Promise<Verification> {
  const parsed: unknown = JSON.parse(value);
  const auditExport = unwrapAuditExport(parsed);
  const integrity = auditExport.integrity as { algorithm?: string; digest?: string } | undefined;
  const signature = auditExport.signature as { algorithm?: string; publicKeySpkiBase64?: string; valueBase64?: string } | undefined;
  if (!integrity || integrity.algorithm !== "SHA-256" || typeof integrity.digest !== "string") throw new Error("This is not a Nuru audit export with a SHA-256 integrity record.");
  const payload = Object.fromEntries(Object.entries(auditExport).filter(([key]) => key !== "integrity" && key !== "signature"));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalizeNuruAuditPayload(payload)));
  const computed = toHex(digest);
  if (computed !== integrity.digest) return { valid: false, message: "Integrity check failed. The payload does not match its recorded digest.", expected: integrity.digest, computed };
  if (signature?.algorithm === "Ed25519" && signature.publicKeySpkiBase64 && signature.valueBase64) {
    const publicKey = await crypto.subtle.importKey("spki", fromBase64(signature.publicKeySpkiBase64), { name: "Ed25519" }, false, ["verify"]);
    const signatureValid = await crypto.subtle.verify({ name: "Ed25519" }, publicKey, fromBase64(signature.valueBase64), new TextEncoder().encode(canonicalizeNuruAuditPayload(payload)));
    return { valid: signatureValid, signature: "verified", message: signatureValid ? "Integrity and Ed25519 signature verified." : "Integrity matches, but the Ed25519 signature is invalid.", expected: integrity.digest, computed };
  }
  return { valid: true, signature: "unsigned", message: "Integrity verified. This export is unsigned because a managed signing key was not configured.", expected: integrity.digest, computed };
}

export function TandemAuditVerifier({ candidateId }: { candidateId?: string }) {
  const [value, setValue] = useState("");
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(Boolean(candidateId));

  async function verify() {
    try {
      setVerification(await verifyAuditExport(value));
    } catch (error) {
      setVerification({ valid: false, message: error instanceof Error ? error.message : "Unable to verify this audit export." });
    }
  }

  useEffect(() => {
    if (!candidateId) return;
    const selectedCandidateId = candidateId;
    let cancelled = false;
    async function loadAuditExport() {
      try {
        const response = await fetch(`/api/tandem/knowledge-candidates/${encodeURIComponent(selectedCandidateId)}/audit`, { cache: "no-store" });
        const payload = await response.json() as unknown;
        if (!response.ok) throw new Error("Unable to load this candidate's audit export.");
        const serialized = JSON.stringify(payload, null, 2);
        const result = await verifyAuditExport(serialized);
        if (!cancelled) { setValue(serialized); setVerification(result); }
      } catch (error) {
        if (!cancelled) setVerification({ valid: false, message: error instanceof Error ? error.message : "Unable to load this candidate's audit export." });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadAuditExport();
    return () => { cancelled = true; };
  }, [candidateId]);

  return <section className="rounded border p-4"><h2 className="font-medium">Verify an audit export</h2><p className="mt-1 text-sm text-slate-600">Verification runs locally in your browser; pasted audit data is not submitted to Nuru.</p>{candidateId && <p className="mt-2 text-sm text-slate-600">{loading ? "Loading this candidate's protected audit export…" : "Loaded the selected candidate's protected audit export."}</p>}<label className="mt-3 block text-sm font-medium">Audit JSON<textarea className="mt-1 block min-h-64 w-full rounded border border-slate-300 p-3 font-mono text-xs" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Paste a Nuru Tandem audit export…" /></label><button disabled={loading} className="mt-3 rounded bg-violet-700 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60" onClick={() => void verify()}>Verify SHA-256 digest</button>{verification && <div className={`mt-3 rounded p-3 text-sm ${verification.valid ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`} role="status"><p>{verification.message}</p>{verification.expected && <p className="mt-2 break-all font-mono text-xs">Recorded: {verification.expected}<br />Computed: {verification.computed}</p>}</div>}</section>;
}
