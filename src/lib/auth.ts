import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, readSessionToken, SESSION_COOKIE_NAME } from "@/src/server/auth/session-token";
import { createUserAccount as createUserAccountInDb, authenticateUser as authenticateUserInDb, createAuthSession, deleteAuthSession, resolveSessionUser, deleteUserAccount as deleteUserAccountInDb } from "@/src/server/services/auth-service";
import { secureCookiesEnabled, getSessionMaxAgeSeconds } from "@/src/config/env";
import type { SessionUser } from "@/src/lib/types";

export { createPasswordHash, verifyPassword } from "@/src/server/auth/password";

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const payload = readSessionToken(token);
  if (!payload) {
    return null;
  }

  const resolved = await resolveSessionUser(payload.sessionId);
  return resolved?.user ?? null;
}

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth");
  }
  return user;
}

export async function setSessionCookie(user: SessionUser) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const session = await createAuthSession(user.id, {
    userAgent: headerStore.get("user-agent"),
    ipAddress: headerStore.get("x-forwarded-for"),
  });
  const expiresAt = new Date(Date.now() + getSessionMaxAgeSeconds() * 1000);

  cookieStore.set(
    SESSION_COOKIE_NAME,
    createSessionToken({
      sessionId: session.id,
      userId: user.id,
      expiresAt: expiresAt.toISOString(),
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: secureCookiesEnabled(),
      path: "/",
      maxAge: getSessionMaxAgeSeconds(),
    },
  );
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const payload = readSessionToken(token);
  if (payload) {
    await deleteAuthSession(payload.sessionId);
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookiesEnabled(),
    expires: new Date(0),
    path: "/",
  });
}

export async function createUserAccount(
  email: string,
  password: string,
  name: string,
  workspaceOverride?: { workspaceId: string; workspaceName: string },
) {
  return createUserAccountInDb(email, password, name, workspaceOverride);
}

export async function authenticateUser(email: string, password: string) {
  return authenticateUserInDb(email, password);
}

export async function deleteUserAccount(userId: string) {
  return deleteUserAccountInDb(userId);
}
