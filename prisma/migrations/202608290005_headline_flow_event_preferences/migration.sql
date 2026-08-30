CREATE TABLE "headline_flow_event_preferences" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "savedAt" TIMESTAMP(3),
  "mutedAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "restoredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "headline_flow_event_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "headline_flow_event_preferences_workspaceId_userId_eventId_key"
  ON "headline_flow_event_preferences"("workspaceId", "userId", "eventId");

CREATE INDEX "headline_flow_event_preferences_workspaceId_userId_mutedAt_idx"
  ON "headline_flow_event_preferences"("workspaceId", "userId", "mutedAt");

CREATE INDEX "headline_flow_event_preferences_workspaceId_userId_resolvedAt_idx"
  ON "headline_flow_event_preferences"("workspaceId", "userId", "resolvedAt");

CREATE INDEX "headline_flow_event_preferences_workspaceId_userId_savedAt_idx"
  ON "headline_flow_event_preferences"("workspaceId", "userId", "savedAt");

ALTER TABLE "headline_flow_event_preferences"
  ADD CONSTRAINT "headline_flow_event_preferences_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "headline_flow_event_preferences"
  ADD CONSTRAINT "headline_flow_event_preferences_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "headline_flow_event_preferences"
  ADD CONSTRAINT "headline_flow_event_preferences_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "headline_flow_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
