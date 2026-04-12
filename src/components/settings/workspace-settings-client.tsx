"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";

type WorkspaceSettingsClientProps = {
  workspace: {
    id: string;
    name: string;
    slug: string;
    description: string;
    plan: string;
  };
  membershipRole: string | null;
  members: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    isDefault: boolean;
  }>;
  invites: Array<{
    id: string;
    token: string;
    email: string | null;
    status: string;
    createdAt: string;
  }>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function WorkspaceSettingsClient(props: WorkspaceSettingsClientProps) {
  const [workspaceName, setWorkspaceName] = useState(props.workspace.name);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invites, setInvites] = useState(props.invites);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [inviteBusy, setInviteBusy] = useState(false);

  async function save() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/settings/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceName,
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: { message?: string } };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error?.message || "Unable to save workspace settings.");
      }
      setMessage("Workspace settings saved.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to save workspace settings.");
    } finally {
      setSaving(false);
    }
  }

  async function createInvite() {
    setInviteBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/settings/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail || null }),
      });
      const payload = (await response.json()) as { ok?: boolean; data?: { invite?: WorkspaceSettingsClientProps["invites"][number] }; error?: { message?: string } };
      if (!response.ok || !payload.ok || !payload.data?.invite) {
        throw new Error(payload.error?.message || "Unable to create invite.");
      }
      setInvites((current) => [payload.data!.invite!, ...current]);
      setInviteEmail("");
      setMessage("Workspace invite created.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to create invite.");
    } finally {
      setInviteBusy(false);
    }
  }

  async function revokeInvite(token: string) {
    setInviteBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/settings/invites?token=${encodeURIComponent(token)}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { ok?: boolean; data?: { snapshot?: { invites?: WorkspaceSettingsClientProps["invites"] } }; error?: { message?: string } };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error?.message || "Unable to revoke invite.");
      }
      setInvites(payload.data?.snapshot?.invites || []);
      setMessage("Workspace invite revoked.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to revoke invite.");
    } finally {
      setInviteBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Workspace settings</CardTitle>
            <CardDescription className="mt-2">
              Manage the workspace name, current members, and invite flow linked to your current tenant context.
            </CardDescription>
          </div>
          <Badge className="border-white/10 bg-white/6 text-slate-200">
            {props.membershipRole || "member"}
          </Badge>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-1">
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Workspace name</span>
            <input
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? "Saving..." : "Save settings"}
          </Button>
          <Link href="/platform" className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
            Open platform
          </Link>
        </div>
        {message ? <p className="mt-3 text-sm text-emerald-200">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>Current workspace membership and role posture.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {props.members.map((member) => (
              <div key={member.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-sm font-medium text-white">{member.name}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {member.email} • {member.role}{member.isDefault ? " • default workspace" : ""}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent invites</CardTitle>
            <CardDescription>Useful when support needs to confirm pending workspace access or reserved email invites.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <label className="space-y-2">
                <span className="text-sm text-slate-300">Invite email</span>
                <input
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="person@example.com"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                />
              </label>
              <Button onClick={() => void createInvite()} disabled={inviteBusy} className="mt-3 w-full justify-between">
                {inviteBusy ? "Working..." : "Create invite"}
              </Button>
            </div>
            {invites.length ? (
              invites.map((invite) => (
                <div key={invite.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{invite.email || "Open invite"}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {invite.status} • created {formatDate(invite.createdAt)}
                      </p>
                    </div>
                    {invite.status === "pending" ? (
                      <Button variant="outline" onClick={() => void revokeInvite(invite.token)} disabled={inviteBusy}>
                        Revoke
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No recent invites for this workspace.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
