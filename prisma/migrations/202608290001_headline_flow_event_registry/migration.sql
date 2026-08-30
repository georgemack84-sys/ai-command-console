CREATE TABLE "headline_flow_events" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "importance" TEXT NOT NULL,
  "confidence" TEXT NOT NULL,
  "firstDetectedAt" TIMESTAMP(3) NOT NULL,
  "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
  "lastMeaningfulUpdateAt" TIMESTAMP(3) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "matchKey" TEXT NOT NULL,
  "sourceCount" INTEGER NOT NULL DEFAULT 0,
  "articleCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "headline_flow_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "headline_flow_event_evidence" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "storyPackageId" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "sourceName" TEXT NOT NULL,
  "articleUrl" TEXT,
  "headline" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "publishedAt" TIMESTAMP(3) NOT NULL,
  "observedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "headline_flow_event_evidence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "headline_flow_events_workspaceId_matchKey_key"
  ON "headline_flow_events"("workspaceId", "matchKey");

CREATE INDEX "headline_flow_events_workspaceId_topic_lastUpdatedAt_idx"
  ON "headline_flow_events"("workspaceId", "topic", "lastUpdatedAt");

CREATE INDEX "headline_flow_events_workspaceId_status_lastMeaningfulUpdateAt_idx"
  ON "headline_flow_events"("workspaceId", "status", "lastMeaningfulUpdateAt");

CREATE UNIQUE INDEX "headline_flow_event_evidence_eventId_storyPackageId_sourceId_key"
  ON "headline_flow_event_evidence"("eventId", "storyPackageId", "sourceId");

CREATE UNIQUE INDEX "headline_flow_event_evidence_workspaceId_eventId_articleUrl_key"
  ON "headline_flow_event_evidence"("workspaceId", "eventId", "articleUrl");

CREATE INDEX "headline_flow_event_evidence_workspaceId_topic_observedAt_idx"
  ON "headline_flow_event_evidence"("workspaceId", "topic", "observedAt");

CREATE INDEX "headline_flow_event_evidence_eventId_observedAt_idx"
  ON "headline_flow_event_evidence"("eventId", "observedAt");

ALTER TABLE "headline_flow_events"
  ADD CONSTRAINT "headline_flow_events_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "headline_flow_event_evidence"
  ADD CONSTRAINT "headline_flow_event_evidence_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "headline_flow_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
