"use client";

import { FormEvent, useMemo, useState } from "react";

type Profile = { profileId: string; objectiveId: string; domain: string };
type Selection = { selectionId: string; selectedStrategyId?: string | null; status: string };
type Notice = { kind: "success" | "error"; message: string } | null;

async function command(path: string, body: unknown) {
  const response = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message ?? payload?.message ?? "The governed request could not be completed.");
  return payload.data;
}

export default function StrategySelectionWorkflow({ initialProfiles, initialSelections }: { initialProfiles: Profile[]; initialSelections: Selection[] }) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [selections, setSelections] = useState(initialSelections);
  const [selectedProfileId, setSelectedProfileId] = useState(initialProfiles.at(-1)?.profileId ?? "");
  const [selectedSelectionId, setSelectedSelectionId] = useState(initialSelections.at(-1)?.selectionId ?? "");
  const [proposalId, setProposalId] = useState("");
  const [bridgeId, setBridgeId] = useState("");
  const [outcomeId, setOutcomeId] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const profileOptions = useMemo(() => profiles.slice().reverse(), [profiles]);
  const selectionOptions = useMemo(() => selections.slice().reverse(), [selections]);

  async function run(name: string, action: () => Promise<void>) {
    setBusy(name); setNotice(null);
    try { await action(); setNotice({ kind: "success", message: "Recorded. The page lists the next governed step; no strategy was executed." }); }
    catch (error) { setNotice({ kind: "error", message: error instanceof Error ? error.message : "Request failed." }); }
    finally { setBusy(null); }
  }

  function createProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    void run("profile", async () => {
      const data = await command("/api/learning/strategy-selection", {
        objectiveId: form.get("objectiveId"), domain: form.get("domain"), primaryType: form.get("primaryType"), typeConfidence: 0.9, secondaryTypes: [], currentMastery: form.get("currentMastery"), targetMastery: form.get("targetMastery"), risk: form.get("risk"), transferRequirement: form.get("transferRequirement"), retentionRequirement: form.get("retentionRequirement"), prerequisites: [], knowledgeGapIds: [], constraints: ["GOVERNANCE"], classifierVersion: "manager-intake@1",
      });
      const profile = data.profile;
      setProfiles((current) => [...current, profile]); setSelectedProfileId(profile.profileId);
    });
  }

  function selectStrategy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    void run("select", async () => {
      const data = await command("/api/learning/strategy-selection/select", {
        profileId: form.get("profileId"), learner: { dimensions: { CONCEPTUAL: "UNKNOWN", APPLICATION: "UNTESTED", GENERALIZATION: "UNTESTED", BOUNDARY_RECOGNITION: "UNTESTED", RETENTION: "UNKNOWN", CALIBRATION: "UNKNOWN" }, satisfiedPrerequisites: [], uncertainPrerequisites: [], failedPrerequisites: [], sourceIds: [] }, budget: { timeMinutes: Number(form.get("timeMinutes")), tokenBudget: 4000, teacherAvailability: form.get("teacherAvailability") }, difficulty: form.get("difficulty"), requiredResources: [], availableResources: [],
      });
      const selection = data.selection;
      setSelections((current) => [...current, selection]); setSelectedSelectionId(selection.selectionId);
    });
  }

  function proposePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    void run("proposal", async () => { const data = await command("/api/learning/strategy-selection/propose-plan", { selectionId: form.get("selectionId"), goal: form.get("goal") }); setProposalId(data.proposal.proposalId); });
  }

  function approvePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    if (!form.get("approval")) { setNotice({ kind: "error", message: "Human approval acknowledgement is required before a lease can be created." }); return; }
    void run("approval", async () => {
      const data = await command("/api/learning/strategy-selection/approve-plan", { curriculumProposalId: form.get("proposalId"), maximumQuestions: Number(form.get("maximumQuestions")), estimatedQuestions: Number(form.get("estimatedQuestions")), estimatedMinutes: Number(form.get("estimatedMinutes")), expiresAt: new Date(Date.now() + 86_400_000).toISOString(), currentState: "UNKNOWN", impact: "MEDIUM" });
      setBridgeId(data.bridge.bridgeId);
    });
  }

  function materializePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const targetSkillIds = String(form.get("targetSkillIds") ?? "").split(",").map((id) => id.trim()).filter(Boolean);
    void run("materialize", async () => { await command("/api/learning/strategy-selection/materialize-curriculum", { bridgeId: form.get("bridgeId"), goal: form.get("goal"), targetSkillIds, learnerStates: {} }); });
  }

  function recordOutcome(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    void run("outcome", async () => { const data = await command("/api/learning/strategy-selection/record-outcome", { selectionId: form.get("selectionId"), curriculumId: form.get("curriculumId"), evaluationId: form.get("evaluationId") }); setOutcomeId(data.outcome.outcomeId); });
  }

  return <section className="space-y-5 rounded border border-violet-200 bg-violet-50/40 p-4">
    <div><h2 className="font-medium">Manager workflow</h2><p className="mt-1 text-sm text-slate-600">Each transition is recorded separately. Recommendation, approval, curriculum materialization, and execution remain distinct authority boundaries.</p></div>
    {notice ? <p className={`rounded p-3 text-sm ${notice.kind === "error" ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`}>{notice.message}</p> : null}
    <div className="grid gap-4 lg:grid-cols-2">
      <WorkflowCard step="1" title="Profile the learning objective"><form onSubmit={createProfile} className="grid gap-2"><input required name="objectiveId" placeholder="Objective ID" className="rounded border p-2" /><input required name="domain" placeholder="Domain" className="rounded border p-2" /><Select name="primaryType" values={["CONCEPTUAL", "PROCEDURAL", "DIAGNOSTIC", "DECISION_JUDGMENT", "PROBLEM_SOLVING"]} /><div className="grid grid-cols-2 gap-2"><Select name="currentMastery" values={["NOVICE", "DEVELOPING", "COMPETENT"]} /><Select name="targetMastery" values={["COMPETENT", "ADVANCED", "MASTERED"]} /></div><div className="grid grid-cols-3 gap-2"><Select name="risk" values={["LOW", "MEDIUM", "HIGH"]} /><Select name="transferRequirement" values={["LOW", "MEDIUM", "HIGH"]} /><Select name="retentionRequirement" values={["LOW", "MEDIUM", "HIGH"]} /></div><Button busy={busy === "profile"}>Create immutable profile</Button></form></WorkflowCard>
      <WorkflowCard step="2" title="Request advisory selection"><form onSubmit={selectStrategy} className="grid gap-2"><select required name="profileId" value={selectedProfileId} onChange={(event) => setSelectedProfileId(event.target.value)} className="rounded border p-2"><option value="">Select an objective profile</option>{profileOptions.map((profile) => <option key={profile.profileId} value={profile.profileId}>{profile.objectiveId} · {profile.domain}</option>)}</select><div className="grid grid-cols-3 gap-2"><input required type="number" min="1" name="timeMinutes" defaultValue="30" className="rounded border p-2" /><Select name="teacherAvailability" values={["NONE", "LOW", "MODERATE", "HIGH"]} /><Select name="difficulty" values={["LOW", "MEDIUM", "HIGH"]} /></div><Button busy={busy === "select"} disabled={!profiles.length}>Record advisory selection</Button><p className="text-xs text-slate-500">This cannot approve a plan or grant execution permission.</p></form></WorkflowCard>
      <WorkflowCard step="3" title="Propose curriculum handoff"><form onSubmit={proposePlan} className="grid gap-2"><select required name="selectionId" value={selectedSelectionId} onChange={(event) => setSelectedSelectionId(event.target.value)} className="rounded border p-2"><option value="">Select an advisory decision</option>{selectionOptions.map((selection) => <option key={selection.selectionId} value={selection.selectionId}>{selection.selectedStrategyId ?? "No strategy"} · {selection.status}</option>)}</select><input required name="goal" placeholder="Learning goal" className="rounded border p-2" /><Button busy={busy === "proposal"} disabled={!selections.length}>Propose plan</Button></form></WorkflowCard>
      <WorkflowCard step="4" title="Explicit human approval"><form onSubmit={approvePlan} className="grid gap-2"><input required name="proposalId" value={proposalId} onChange={(event) => setProposalId(event.target.value)} placeholder="Curriculum proposal ID" className="rounded border p-2" /><div className="grid grid-cols-3 gap-2"><input required type="number" min="1" name="maximumQuestions" defaultValue="10" className="rounded border p-2" /><input required type="number" min="1" name="estimatedQuestions" defaultValue="5" className="rounded border p-2" /><input required type="number" min="1" name="estimatedMinutes" defaultValue="30" className="rounded border p-2" /></div><label className="text-sm"><input type="checkbox" name="approval" className="mr-2" />I explicitly approve this bounded plan.</label><Button busy={busy === "approval"} disabled={!proposalId}>Approve and create bounded lease</Button></form></WorkflowCard>
      <WorkflowCard step="5" title="Materialize a proposed curriculum"><form onSubmit={materializePlan} className="grid gap-2"><input required name="bridgeId" value={bridgeId} onChange={(event) => setBridgeId(event.target.value)} placeholder="Approval bridge ID" className="rounded border p-2" /><input required name="goal" placeholder="Learning goal" className="rounded border p-2" /><input required name="targetSkillIds" placeholder="Target skill IDs, comma-separated" className="rounded border p-2" /><Button busy={busy === "materialize"} disabled={!bridgeId}>Materialize proposed curriculum</Button><p className="text-xs text-slate-500">This creates a proposed curriculum only; it does not run learning.</p></form></WorkflowCard>
      <WorkflowCard step="6" title="Record outcome and review reselection"><form onSubmit={recordOutcome} className="grid gap-2"><input required name="selectionId" defaultValue={selectedSelectionId} placeholder="Selection ID" className="rounded border p-2" /><input required name="curriculumId" placeholder="Materialized curriculum ID" className="rounded border p-2" /><input required name="evaluationId" placeholder="Phase 39 evaluation ID" className="rounded border p-2" /><Button busy={busy === "outcome"}>Record governed outcome</Button></form>{outcomeId ? <button type="button" onClick={() => void run("reselect", async () => { await command("/api/learning/strategy-selection/reselect", { outcomeId }); })} disabled={busy === "reselect"} className="mt-2 text-sm text-violet-700 underline">{busy === "reselect" ? "Reviewing…" : "Review advisory reselection"}</button> : null}</WorkflowCard>
    </div>
  </section>;
}

function WorkflowCard({ step, title, children }: { step: string; title: string; children: React.ReactNode }) { return <article className="rounded border bg-white p-4"><p className="text-xs font-medium uppercase tracking-wide text-violet-700">Step {step}</p><h3 className="mt-1 font-medium">{title}</h3><div className="mt-3">{children}</div></article>; }
function Select({ name, values }: { name: string; values: string[] }) { return <select name={name} className="rounded border p-2">{values.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select>; }
function Button({ children, busy, disabled }: { children: React.ReactNode; busy?: boolean; disabled?: boolean }) { return <button disabled={busy || disabled} className="rounded bg-violet-700 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Recording…" : children}</button>; }
