-- Keep periodic scoped-work monitoring fast as task history grows.
CREATE INDEX "AgentTask_workspaceId_status_createdAt_idx" ON "AgentTask"("workspaceId", "status", "createdAt");
CREATE INDEX "AgentTask_workspaceId_status_updatedAt_idx" ON "AgentTask"("workspaceId", "status", "updatedAt");
