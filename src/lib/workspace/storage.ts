import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { AssistantMemoryEntry } from "@/src/lib/assistant/types";
import { demoResearchBriefs, demoResearchReports, demoSavedRoutes, getDemoTrafficState } from "@/src/lib/mock-data";
import { getStorageDriver, getWorkspaceDataPath, shouldWriteLegacyJsonMirrors } from "@/src/lib/server/runtime";
import { readWorkspaceDocument, writeWorkspaceDocument } from "@/src/lib/server/workspace-store";
import type { ResearchBrief, ResearchReport, SavedRoute, TrafficState, UserAccount, UserRole, UserStatus } from "@/src/lib/types";

const usersPath = getWorkspaceDataPath("workspace-users.json");
const routesPath = getWorkspaceDataPath("workspace-user-routes.json");
const trafficStatePath = getWorkspaceDataPath("workspace-traffic-state.json");
const assistantMemoryPath = getWorkspaceDataPath("workspace-assistant-memory.json");
const researchBriefsPath = getWorkspaceDataPath("research-briefs.json");
const researchReportsPath = getWorkspaceDataPath("research-reports.json");
const invitesPath = getWorkspaceDataPath("workspace-invites.json");
const persistenceDriver = getStorageDriver();
const writeLegacyJsonMirrors = shouldWriteLegacyJsonMirrors();

type UserRoutesStore = Record<string, SavedRoute[]>;
type AssistantMemoryStore = Record<string, AssistantMemoryEntry[]>;
type ResearchBriefStore = Record<string, ResearchBrief[]>;
type ResearchReportStore = Record<string, ResearchReport[]>;
export type WorkspaceInvite = {
  id: string;
  token: string;
  email: string | null;
  workspaceId: string;
  workspaceName: string;
  createdAt: string;
  createdById: string;
  createdByEmail: string;
  status: "pending" | "accepted" | "revoked";
  acceptedAt?: string;
  acceptedByUserId?: string;
};

function normalizeWorkspaceKey(scopeId?: string | null) {
  return String(scopeId || "default");
}

async function readJsonFile<T>(filePath: string, fallback: T) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile<T>(filePath: string, value: T) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readDocument<T>(key: string, filePath: string, fallback: T) {
  if (persistenceDriver === "sqlite") {
    const fromDatabase = readWorkspaceDocument<T>(key);
    if (fromDatabase !== undefined) {
      return fromDatabase;
    }
  }

  const seeded = await readJsonFile<T>(filePath, fallback);
  if (persistenceDriver === "sqlite") {
    writeWorkspaceDocument(key, seeded);
    if (writeLegacyJsonMirrors) {
      await writeJsonFile(filePath, seeded);
    }
  }
  return seeded;
}

async function writeDocument<T>(key: string, filePath: string, value: T) {
  if (persistenceDriver === "sqlite") {
    writeWorkspaceDocument(key, value);
  }

  if (persistenceDriver === "json" || writeLegacyJsonMirrors) {
    await writeJsonFile(filePath, value);
  }
}

export async function readUsersFromStorage() {
  const users = await readDocument<UserAccount[]>("workspace.users", usersPath, []);
  return (Array.isArray(users) ? users : []).map((user, index) => ({
    ...user,
    role: user.role || (index === 0 ? "admin" : "operator"),
    status: user.status || "active",
    workspaceId: user.workspaceId || "default",
    workspaceName: user.workspaceName || "Main Workspace",
  }));
}

export async function writeUsersToStorage(users: UserAccount[]) {
  return writeDocument("workspace.users", usersPath, users);
}

export async function updateUserRoleInStorage(userId: string, role: UserRole) {
  const users = await readUsersFromStorage();
  const next = users.map((user) => (user.id === userId ? { ...user, role } : user));
  await writeUsersToStorage(next);
  return next.find((user) => user.id === userId) ?? null;
}

export async function updateUserStatusInStorage(userId: string, status: UserStatus) {
  const users = await readUsersFromStorage();
  const next = users.map((user) => (user.id === userId ? { ...user, status } : user));
  await writeUsersToStorage(next);
  return next.find((user) => user.id === userId) ?? null;
}

export async function updateUserWorkspaceInStorage(userId: string, workspaceId: string, workspaceName: string) {
  const users = await readUsersFromStorage();
  const next = users.map((user) =>
    user.id === userId ? { ...user, workspaceId, workspaceName } : user
  );
  await writeUsersToStorage(next);
  return next.find((user) => user.id === userId) ?? null;
}

export async function renameWorkspaceInStorage(workspaceId: string, workspaceName: string) {
  const users = await readUsersFromStorage();
  const next = users.map((user) =>
    user.workspaceId === workspaceId ? { ...user, workspaceName } : user
  );
  await writeUsersToStorage(next);
  return next.filter((user) => user.workspaceId === workspaceId);
}

export async function readInvitesFromStorage(): Promise<WorkspaceInvite[]> {
  return readDocument<WorkspaceInvite[]>("workspace.invites", invitesPath, []);
}

export async function writeInvitesToStorage(invites: WorkspaceInvite[]) {
  return writeDocument("workspace.invites", invitesPath, invites);
}

export async function createWorkspaceInviteInStorage(input: {
  email?: string | null;
  workspaceId: string;
  workspaceName: string;
  createdById: string;
  createdByEmail: string;
}): Promise<WorkspaceInvite> {
  const invites = await readInvitesFromStorage();
  const invite: WorkspaceInvite = {
    id: randomUUID(),
    token: randomUUID(),
    email: input.email?.trim().toLowerCase() || null,
    workspaceId: input.workspaceId,
    workspaceName: input.workspaceName,
    createdAt: new Date().toISOString(),
    createdById: input.createdById,
    createdByEmail: input.createdByEmail,
    status: "pending",
  };
  await writeInvitesToStorage([invite, ...invites]);
  return invite;
}

export async function revokeWorkspaceInviteInStorage(token: string): Promise<WorkspaceInvite | null> {
  const invites = await readInvitesFromStorage();
  let revoked: WorkspaceInvite | null = null;
  const next = invites.map((invite) => {
    if (invite.token !== token) {
      return invite;
    }
    revoked = { ...invite, status: "revoked" };
    return revoked;
  });
  await writeInvitesToStorage(next);
  return revoked;
}

export async function readInviteByToken(token: string): Promise<WorkspaceInvite | null> {
  const invites = await readInvitesFromStorage();
  return invites.find((invite) => invite.token === token) ?? null;
}

export async function consumeInviteInStorage(token: string, acceptedByUserId: string): Promise<WorkspaceInvite | null> {
  const invites = await readInvitesFromStorage();
  let accepted: WorkspaceInvite | null = null;
  const next = invites.map((invite) => {
    if (invite.token !== token) {
      return invite;
    }
    accepted = {
      ...invite,
      status: "accepted",
      acceptedAt: new Date().toISOString(),
      acceptedByUserId,
    };
    return accepted;
  });
  await writeInvitesToStorage(next);
  return accepted;
}

export async function readUserRoutesFromStorage() {
  return readDocument<UserRoutesStore>("workspace.routes", routesPath, { demo: demoSavedRoutes });
}

export async function writeUserRoutesToStorage(routes: UserRoutesStore) {
  return writeDocument("workspace.routes", routesPath, routes);
}

export async function readRoutesForUser(userId: string) {
  const store = await readUserRoutesFromStorage();
  const key = normalizeWorkspaceKey(userId);
  return store[key] ?? store[userId] ?? [];
}

export async function readRoutesForAnyUser(userIds: Array<string | null | undefined>) {
  const store = await readUserRoutesFromStorage();

  for (const userId of userIds) {
    if (!userId) {
      continue;
    }

    const key = normalizeWorkspaceKey(userId);
    const routes = store[key] ?? store[userId];
    if (routes?.length) {
      return routes;
    }
  }

  return [];
}

export async function writeRoutesForUser(userId: string, savedRoutes: SavedRoute[]) {
  const store = await readUserRoutesFromStorage();
  const key = normalizeWorkspaceKey(userId);
  const next = { ...store, [key]: savedRoutes };
  await writeUserRoutesToStorage(next);
  return next[key];
}

export async function readTrafficStateFromStorage() {
  return readDocument<TrafficState>("workspace.traffic", trafficStatePath, getDemoTrafficState());
}

export async function writeTrafficStateToStorage(state: TrafficState) {
  return writeDocument("workspace.traffic", trafficStatePath, state);
}

export async function readAssistantMemory(userId: string) {
  const store = await readDocument<AssistantMemoryStore>("workspace.assistant-memory", assistantMemoryPath, {});
  const key = normalizeWorkspaceKey(userId);
  return store[key] ?? store[userId] ?? [];
}

export async function writeAssistantMemory(userId: string, entries: AssistantMemoryEntry[]) {
  const store = await readDocument<AssistantMemoryStore>("workspace.assistant-memory", assistantMemoryPath, {});
  const key = normalizeWorkspaceKey(userId);
  const next = { ...store, [key]: entries };
  await writeDocument("workspace.assistant-memory", assistantMemoryPath, next);
  return next[key];
}

export async function readResearchBriefsFromStorage() {
  return readDocument<ResearchBriefStore>("workspace.research-briefs", researchBriefsPath, { demo: demoResearchBriefs });
}

export async function writeResearchBriefsToStorage(briefs: ResearchBriefStore) {
  return writeDocument("workspace.research-briefs", researchBriefsPath, briefs);
}

export async function readBriefsForUser(userId: string) {
  const store = await readResearchBriefsFromStorage();
  const key = normalizeWorkspaceKey(userId);
  return store[key] ?? store[userId] ?? [];
}

export async function writeBriefsForUser(userId: string, briefs: ResearchBrief[]) {
  const store = await readResearchBriefsFromStorage();
  const key = normalizeWorkspaceKey(userId);
  const next = { ...store, [key]: briefs };
  await writeResearchBriefsToStorage(next);
  return next[key];
}

export async function readResearchReportsFromStorage() {
  return readDocument<ResearchReportStore>("workspace.research-reports", researchReportsPath, { demo: demoResearchReports });
}

export async function writeResearchReportsToStorage(reports: ResearchReportStore) {
  return writeDocument("workspace.research-reports", researchReportsPath, reports);
}

export async function readReportsForUser(userId: string) {
  const store = await readResearchReportsFromStorage();
  const key = normalizeWorkspaceKey(userId);
  return store[key] ?? store[userId] ?? [];
}

export async function writeReportsForUser(userId: string, reports: ResearchReport[]) {
  const store = await readResearchReportsFromStorage();
  const key = normalizeWorkspaceKey(userId);
  const next = { ...store, [key]: reports };
  await writeResearchReportsToStorage(next);
  return next[key];
}
