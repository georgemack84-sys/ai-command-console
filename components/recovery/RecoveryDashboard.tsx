"use client";

import { useEffect, useMemo, useState } from "react";
import { SectionShell } from "@/src/components/ui/section-shell";
import type { RecoveryEvidenceBundle } from "@/types/recoveryEvidence";
import type { DashboardState, SystemState } from "@/types/recoveryDashboard";
import {
  addOperatorNote,
  dismissAdvisory,
  escalateAdvisory,
  exportEvidence,
  fetchEvidence,
  fetchOperatorView,
  requestVerification,
} from "@/lib/recovery/recoveryApiClient";
import { RecoveryEvidencePanel } from "@/components/recovery/RecoveryEvidencePanel";
import { RecoveryOperatorActionsPanel } from "@/components/recovery/RecoveryOperatorActionsPanel";
import { RecoveryOperatorNotes } from "@/components/recovery/RecoveryOperatorNotes";
import { RecoveryRiskFlags } from "@/components/recovery/RecoveryRiskFlags";
import { RecoveryStatusOverview } from "@/components/recovery/RecoveryStatusOverview";
import { RecoveryTimelinePanel } from "@/components/recovery/RecoveryTimelinePanel";
import { RecoveryWarningBanner } from "@/components/recovery/RecoveryWarningBanner";

export function deriveSystemState(evidence: RecoveryEvidenceBundle | null): SystemState {
  if (!evidence) {
    return "unknown";
  }
  if (evidence.state === "normal") {
    return "normal";
  }
  if (evidence.state === "disputed") {
    return "disputed";
  }
  if (evidence.meta.completeness === "partial") {
    return "partial";
  }
  return "unknown";
}

function downloadExport(executionId: string, format: "json" | "markdown", payload: RecoveryEvidenceBundle | string) {
  const blob =
    format === "json"
      ? new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
      : new Blob([String(payload)], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${executionId}-recovery-evidence.${format === "json" ? "json" : "md"}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function RecoveryDashboard({ initialExecutionId }: { initialExecutionId: string }) {
  const [state, setState] = useState<DashboardState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const executionId = initialExecutionId;

  async function load() {
    if (!executionId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [operatorView, evidence] = await Promise.all([
        fetchOperatorView(executionId),
        fetchEvidence(executionId),
      ]);
      setState({
        executionId,
        operatorView,
        evidence,
        loading: false,
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load recovery dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // The loader is intentionally tied to executionId changes only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executionId]);

  const systemState = useMemo(() => deriveSystemState(state?.evidence || null), [state?.evidence]);

  async function handleRequestVerification() {
    if (!executionId) return;
    await requestVerification(executionId);
    await load();
  }

  async function handleDismissAdvisory() {
    if (!executionId) return;
    await dismissAdvisory(executionId, "resolved");
    await load();
  }

  async function handleEscalateAdvisory() {
    if (!executionId) return;
    await escalateAdvisory(executionId, "needs review");
    await load();
  }

  async function handleAddNote(note: string) {
    if (!executionId) return;
    await addOperatorNote(executionId, note);
    await load();
  }

  async function handleExport(format: "json" | "markdown") {
    if (!executionId) return;
    const payload = await exportEvidence(executionId, format);
    downloadExport(executionId, format, payload);
  }

  if (!executionId) {
    return (
      <SectionShell className="p-6 sm:p-8">
        <p className="text-sm text-slate-300">Select a recovery execution with <code>executionId</code> in the URL to inspect it.</p>
      </SectionShell>
    );
  }

  return (
    <div className="space-y-6">
      <SectionShell className="p-6 sm:p-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-sky-200">Recovery Control Panel</p>
          <h2 className="font-display text-3xl font-semibold text-white">Evidence-aware recovery dashboard</h2>
          <p className="text-sm text-slate-300">What the system believes, what the timeline proves, what the operator can safely do, and what evidence can be exported right now.</p>
        </div>
      </SectionShell>

      {loading ? <p className="text-sm text-slate-300">Loading recovery dashboard...</p> : null}
      {error ? <p className="text-sm text-rose-200">{error}</p> : null}

      {state ? (
        <div className="space-y-4">
          <RecoveryStatusOverview
            systemState={systemState}
            operatorView={state.operatorView}
            evidence={state.evidence}
          />
          <RecoveryWarningBanner operatorView={state.operatorView} evidence={state.evidence} />
          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <RecoveryOperatorActionsPanel
              actions={state.operatorView.allowedActions}
              onRequestVerification={() => void handleRequestVerification()}
              onDismissAdvisory={() => void handleDismissAdvisory()}
              onEscalateAdvisory={() => void handleEscalateAdvisory()}
              onViewEvidence={() => document.getElementById("recovery-evidence-panel")?.scrollIntoView({ behavior: "smooth" })}
            />
            <RecoveryRiskFlags risk={state.operatorView.readModel.risk} />
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <RecoveryTimelinePanel timeline={state.operatorView.timeline} />
            <div id="recovery-evidence-panel">
              <RecoveryEvidencePanel
                evidence={state.evidence}
                onExportJson={() => void handleExport("json")}
                onExportMarkdown={() => void handleExport("markdown")}
              />
            </div>
          </div>
          <RecoveryOperatorNotes onSubmit={handleAddNote} />
        </div>
      ) : null}
    </div>
  );
}
