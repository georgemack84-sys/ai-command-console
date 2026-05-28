import type { RecoveryEvidenceBundle } from "../../types/recoveryEvidence";
import type { OperatorView } from "../../types/recoveryOperatorApi";
import type { RecoveryReadModel } from "../../types/recoveryReadModel";
import type { RecoveryTimeline } from "../../types/recoveryTimeline";

type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: string | { message?: string };
};

async function readEnvelope<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !payload.ok || payload.data === undefined) {
    const message = typeof payload.error === "string" ? payload.error : payload.error?.message || "Request failed.";
    throw new Error(message);
  }
  return payload.data;
}

async function postJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return readEnvelope<T>(response);
}

export async function fetchOperatorView(executionId: string): Promise<OperatorView> {
  const response = await fetch(`/api/recovery/${encodeURIComponent(executionId)}/operator-view`, { cache: "no-store" });
  return readEnvelope<OperatorView>(response);
}

export async function fetchReadModel(executionId: string): Promise<RecoveryReadModel> {
  const response = await fetch(`/api/recovery/${encodeURIComponent(executionId)}/read-model`, { cache: "no-store" });
  return readEnvelope<RecoveryReadModel>(response);
}

export async function fetchTimeline(executionId: string): Promise<RecoveryTimeline> {
  const response = await fetch(`/api/recovery/${encodeURIComponent(executionId)}/timeline`, { cache: "no-store" });
  return readEnvelope<RecoveryTimeline>(response);
}

export async function fetchEvidence(executionId: string): Promise<RecoveryEvidenceBundle> {
  const response = await fetch(`/api/recovery/${encodeURIComponent(executionId)}/evidence`, { cache: "no-store" });
  return readEnvelope<RecoveryEvidenceBundle>(response);
}

export async function exportEvidence(executionId: string, format: "json" | "markdown"): Promise<RecoveryEvidenceBundle | string> {
  const response = await fetch(`/api/recovery/${encodeURIComponent(executionId)}/evidence?format=${encodeURIComponent(format)}`, {
    cache: "no-store",
  });
  return readEnvelope<RecoveryEvidenceBundle | string>(response);
}

export function addOperatorNote(executionId: string, note: string, notedBy = "operator") {
  return postJson(`/api/recovery/${encodeURIComponent(executionId)}/operator-note`, {
    note,
    notedBy,
  });
}

export function requestVerification(executionId: string, requestedBy = "operator") {
  return postJson(`/api/recovery/${encodeURIComponent(executionId)}/request-verification`, {
    requestedBy,
  });
}

export function dismissAdvisory(executionId: string, reason: string, dismissedBy = "operator") {
  return postJson(`/api/recovery/${encodeURIComponent(executionId)}/dismiss-advisory`, {
    reason,
    dismissedBy,
  });
}

export function escalateAdvisory(executionId: string, reason: string, escalatedBy = "operator") {
  return postJson(`/api/recovery/${encodeURIComponent(executionId)}/escalate-advisory`, {
    reason,
    escalatedBy,
  });
}

