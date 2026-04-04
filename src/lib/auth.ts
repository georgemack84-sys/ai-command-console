import { createHmac, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { areSecureCookiesEnabled, getAuthSecret, getSessionMaxAgeSeconds } from "@/src/lib/server/runtime";
import { readUsersFromStorage, writeUsersToStorage } from "@/src/lib/workspace/storage";
import type { SessionUser, UserAccount, UserRole } from "@/src/lib/types";

const COOKIE_NAME = "ai_command_console_session";

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

export function createPasswordHash(password: string) {
  const salt = randomUUID();
  return `${salt}:${hashPassword(password, salt)}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) {
    return false;
  }

  const attempted = Buffer.from(hashPassword(password, salt), "hex");
  const stored = Buffer.from(hash, "hex");
  if (attempted.length !== stored.length) {
    return false;
  }

  return timingSafeEqual(attempted, stored);
}

function signPayload(payload: string) {
  return createHmac("sha256", getAuthSecret()).update(payload).digest("hex");
}

function normalizeWorkspace(parsed: Partial<SessionUser>) {
  return {
    status: parsed.status || "active",
    workspaceId: parsed.workspaceId || "default",
    workspaceName: parsed.workspaceName || "Main Workspace",
  };
}

export function createSessionToken(user: SessionUser) {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  return `${payload}.${signPayload(payload)}`;
}

export function readSessionToken(token?: string | null): SessionUser | null {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature || signPayload(payload) !== signature) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<SessionUser>;
    return parsed?.id && parsed?.email && parsed?.name
      ? {
          id: parsed.id,
          email: parsed.email,
          name: parsed.name,
          role: parsed.role || "operator",
          ...normalizeWorkspace(parsed),
        }
      : null;
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  return readSessionToken(cookieStore.get(COOKIE_NAME)?.value ?? null);
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
  cookieStore.set(COOKIE_NAME, createSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: areSecureCookiesEnabled(),
    path: "/",
    maxAge: getSessionMaxAgeSeconds(),
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: areSecureCookiesEnabled(),
    expires: new Date(0),
    path: "/",
  });
}

export async function createUserAccount(
  email: string,
  password: string,
  name: string,
  workspaceOverride?: { workspaceId: string; workspaceName: string }
) {
  const users = await readUsersFromStorage();
  const existing = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const role: UserRole = users.length === 0 ? "admin" : "operator";
  const workspaceId = workspaceOverride?.workspaceId || users[0]?.workspaceId || "default";
  const workspaceName = workspaceOverride?.workspaceName || users[0]?.workspaceName || "Main Workspace";

  const user: UserAccount = {
    id: randomUUID(),
    email: email.toLowerCase(),
    passwordHash: createPasswordHash(password),
    name,
    role,
    status: "active",
    workspaceId,
    workspaceName,
    createdAt: new Date().toISOString(),
  };
  await writeUsersToStorage([...users, user]);
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      workspaceId: user.workspaceId,
      workspaceName: user.workspaceName,
    } satisfies SessionUser,
  };
}

export async function authenticateUser(email: string, password: string) {
  const users = await readUsersFromStorage();
  const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!user || user.status === "disabled" || !verifyPassword(password, user.passwordHash)) {
    return { error: "Invalid email or password." };
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || "operator",
      status: user.status || "active",
      workspaceId: user.workspaceId || "default",
      workspaceName: user.workspaceName || "Main Workspace",
    } satisfies SessionUser,
  };
}
