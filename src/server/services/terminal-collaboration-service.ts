import { createRequire } from "node:module";
import { z } from "zod";
import { AppError } from "@/src/server/api/errors";
import type { SessionUser } from "@/src/lib/types";

const require = createRequire(import.meta.url);

const {
  upsertSharedSession,
  createHandoff,
  closeHandoff,
  updateInboxItemState,
  recordInboxHistoryItem,
  updateDigestPreferences,
} = require("../../../services/collaboration");
const { appendAuditEvent } = require("../../../services/auditTrail");

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("collaboration:share-session"),
    payload: z.object({
      id: z.string().optional(),
      name: z.string().min(1),
      draftCommand: z.string().default(""),
      macros: z.array(z.any()).optional().default([]),
      sharedWith: z.array(z.string()).optional().default(["team"]),
    }),
  }),
  z.object({
    action: z.literal("collaboration:create-handoff"),
    payload: z.object({
      title: z.string().min(1),
      note: z.string().min(1),
      assignedTo: z.string().optional().default("team"),
    }),
  }),
  z.object({
    action: z.literal("collaboration:close-handoff"),
    payload: z.object({
      handoffId: z.string().min(1),
    }),
  }),
  z.object({
    action: z.literal("collaboration:inbox-mark-read"),
    payload: z.object({
      itemId: z.string().min(1),
    }),
  }),
  z.object({
    action: z.literal("collaboration:inbox-acknowledge"),
    payload: z.object({
      itemId: z.string().min(1),
    }),
  }),
  z.object({
    action: z.literal("collaboration:digest-preferences"),
    payload: z.object({
      enabled: z.boolean().optional(),
      cadence: z.string().optional(),
      preferredChannel: z.string().optional(),
      includeTrustReport: z.boolean().optional(),
      trustAudience: z.string().optional(),
      trustEnvironment: z.string().optional(),
      immediateOnTrustDrop: z.boolean().optional(),
    }),
  }),
]);

type TerminalCollaborationActionInput = z.infer<typeof actionSchema>;
type CollaborationActor = Pick<SessionUser, "id" | "name" | "email" | "role" | "workspaceId">;

type InboxItem = {
  id: string;
  read?: boolean;
  acknowledged?: boolean;
  [key: string]: unknown;
};

function findInboxItem(overview: unknown, itemId: string): InboxItem | null {
  const inbox =
    overview &&
    typeof overview === "object" &&
    "collaboration" in overview &&
    overview.collaboration &&
    typeof overview.collaboration === "object" &&
    "inbox" in overview.collaboration &&
    Array.isArray(overview.collaboration.inbox)
      ? (overview.collaboration.inbox as InboxItem[])
      : [];

  return inbox.find((item) => item.id === itemId) || null;
}

export async function executeTerminalCollaborationAction(
  input: unknown,
  actor: CollaborationActor,
  currentOverview?: unknown,
) {
  const parsed = actionSchema.parse(input) as TerminalCollaborationActionInput;
  const actorName = actor.name || actor.email;

  if (parsed.action === "collaboration:share-session") {
    const session = upsertSharedSession({
      id: parsed.payload.id,
      name: parsed.payload.name,
      draftCommand: parsed.payload.draftCommand,
      macros: parsed.payload.macros,
      ownerId: actor.id,
      ownerName: actorName,
      sharedWith: parsed.payload.sharedWith,
    });
    appendAuditEvent({ type: parsed.action, message: `Shared session ${session.name}.`, payload: { sessionId: session.id, actorId: actor.id } });
    return { action: parsed.action, output: `Shared session "${session.name}".` };
  }

  if (parsed.action === "collaboration:create-handoff") {
    const handoff = createHandoff({
      title: parsed.payload.title,
      note: parsed.payload.note,
      assignedTo: parsed.payload.assignedTo,
      assignedById: actor.id,
      assignedByName: actorName,
    });
    appendAuditEvent({ type: parsed.action, message: `Created handoff ${handoff.title}.`, payload: { handoffId: handoff.id, actorId: actor.id } });
    return { action: parsed.action, output: `Created handoff "${handoff.title}".` };
  }

  if (parsed.action === "collaboration:close-handoff") {
    const handoff = closeHandoff(parsed.payload.handoffId);
    if (!handoff) {
      throw new AppError(404, "handoff_not_found", `Handoff not found: ${parsed.payload.handoffId}`);
    }
    appendAuditEvent({ type: parsed.action, message: `Closed handoff ${handoff.title}.`, payload: { handoffId: handoff.id, actorId: actor.id } });
    return { action: parsed.action, output: `Closed handoff "${handoff.title}".` };
  }

  if (parsed.action === "collaboration:digest-preferences") {
    const preferences = updateDigestPreferences(actor.id, {
      enabled: Boolean(parsed.payload.enabled),
      cadence: String(parsed.payload.cadence || "manual"),
      preferredChannel: String(parsed.payload.preferredChannel || "inbox"),
      includeTrustReport: Boolean(parsed.payload.includeTrustReport),
      trustAudience: String(parsed.payload.trustAudience || "self"),
      trustEnvironment: String(parsed.payload.trustEnvironment || "all"),
      immediateOnTrustDrop: Boolean(parsed.payload.immediateOnTrustDrop),
    });
    appendAuditEvent({ type: parsed.action, message: `Updated digest preferences for ${actorName}.`, payload: { actorId: actor.id, preferences } });
    return { action: parsed.action, output: "Updated digest preferences." };
  }

  const inboxItem = findInboxItem(currentOverview, parsed.payload.itemId);
  const timestamp = new Date().toISOString();

  if (parsed.action === "collaboration:inbox-mark-read") {
    updateInboxItemState(actor.id, parsed.payload.itemId, { readAt: timestamp });
    if (inboxItem) {
      recordInboxHistoryItem(actor.id, { ...inboxItem, read: true, updatedAt: timestamp });
    }
    appendAuditEvent({ type: parsed.action, message: `Marked inbox item ${parsed.payload.itemId} as read.`, payload: { itemId: parsed.payload.itemId, actorId: actor.id } });
    return { action: parsed.action, output: `Marked ${parsed.payload.itemId} as read.` };
  }

  updateInboxItemState(actor.id, parsed.payload.itemId, { readAt: timestamp, acknowledgedAt: timestamp });
  if (inboxItem) {
    recordInboxHistoryItem(actor.id, {
      ...inboxItem,
      read: true,
      acknowledged: true,
      updatedAt: timestamp,
    });
  }
  appendAuditEvent({ type: parsed.action, message: `Acknowledged inbox item ${parsed.payload.itemId}.`, payload: { itemId: parsed.payload.itemId, actorId: actor.id } });
  return { action: parsed.action, output: `Acknowledged ${parsed.payload.itemId}.` };
}
