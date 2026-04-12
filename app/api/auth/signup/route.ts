import { z } from "zod";
import { createUserAccount, deleteUserAccount, setSessionCookie } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { consumeWorkspaceInvite, readInviteByToken } from "@/src/server/services/invite-service";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  inviteToken: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = signupSchema.parse(await request.json());
    let workspaceOverride: { workspaceId: string; workspaceName: string } | undefined;
    const inviteToken = String(body.inviteToken || "").trim();

    if (inviteToken) {
      const invite = await readInviteByToken(inviteToken);
      if (!invite || invite.status !== "pending") {
        throw new AppError(400, "invalid_invite", "Invite is invalid or no longer available.");
      }
      if (invite.email && invite.email !== body.email.toLowerCase()) {
        throw new AppError(400, "invite_email_mismatch", "This invite is reserved for a different email address.");
      }
      workspaceOverride = {
        workspaceId: invite.workspaceId,
        workspaceName: invite.workspaceName,
      };
    }

    const result = await createUserAccount(body.email, body.password, body.name, workspaceOverride);
    if ("error" in result) {
      throw new AppError(409, "account_exists", result.error || "An account with that email already exists.");
    }

    if (inviteToken) {
      const consumed = await consumeWorkspaceInvite(inviteToken, result.user.id);
      if (!consumed) {
        await deleteUserAccount(result.user.id);
        throw new AppError(409, "invite_no_longer_available", "Invite was revoked before the account could join the workspace.");
      }
    }
    await setSessionCookie(result.user);
    return apiSuccess({ user: result.user }, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to create account.");
  }
}
