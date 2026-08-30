-- CreateTable
CREATE TABLE "headline_flow_interaction_events" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT,
    "storyId" TEXT,
    "topic" TEXT,
    "action" TEXT NOT NULL,
    "providerId" TEXT,
    "sourceName" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "headline_flow_interaction_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "headline_flow_interaction_events_workspaceId_userId_occurredAt_idx" ON "headline_flow_interaction_events"("workspaceId", "userId", "occurredAt");

-- CreateIndex
CREATE INDEX "headline_flow_interaction_events_workspaceId_action_occurredAt_idx" ON "headline_flow_interaction_events"("workspaceId", "action", "occurredAt");

-- CreateIndex
CREATE INDEX "headline_flow_interaction_events_workspaceId_topic_occurredAt_idx" ON "headline_flow_interaction_events"("workspaceId", "topic", "occurredAt");

-- CreateIndex
CREATE INDEX "headline_flow_interaction_events_workspaceId_eventId_occurredAt_idx" ON "headline_flow_interaction_events"("workspaceId", "eventId", "occurredAt");

-- AddForeignKey
ALTER TABLE "headline_flow_interaction_events" ADD CONSTRAINT "headline_flow_interaction_events_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "headline_flow_interaction_events" ADD CONSTRAINT "headline_flow_interaction_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "headline_flow_interaction_events" ADD CONSTRAINT "headline_flow_interaction_events_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "headline_flow_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
