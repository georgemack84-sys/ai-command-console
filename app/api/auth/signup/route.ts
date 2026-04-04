import { NextResponse } from "next/server";
import { createUserAccount, setSessionCookie } from "@/src/lib/auth";
import { consumeInviteInStorage, readInviteByToken } from "@/src/lib/workspace/storage";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string; name?: string; inviteToken?: string };
  if (!body.email || !body.password || !body.name) {
    return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
  }

  let workspaceOverride: { workspaceId: string; workspaceName: string } | undefined;
  const inviteToken = String(body.inviteToken || "").trim();

  if (inviteToken) {
    const invite = await readInviteByToken(inviteToken);
    if (!invite || invite.status !== "pending") {
      return NextResponse.json({ error: "Invite is invalid or no longer available." }, { status: 400 });
    }
    if (invite.email && invite.email !== body.email.toLowerCase()) {
      return NextResponse.json({ error: "This invite is reserved for a different email address." }, { status: 400 });
    }
    workspaceOverride = {
      workspaceId: invite.workspaceId,
      workspaceName: invite.workspaceName,
    };
  }

  const result = await createUserAccount(body.email, body.password, body.name, workspaceOverride);
  if ("error" in result) {
    return NextResponse.json(result, { status: 409 });
  }

  if (inviteToken) {
    await consumeInviteInStorage(inviteToken, result.user.id);
  }
  await setSessionCookie(result.user);
  return NextResponse.json({ user: result.user });
}
