CREATE TYPE "WorkspaceInviteStatus" AS ENUM ('pending', 'accepted', 'revoked');

CREATE TABLE "WorkspaceInvite" (
  "id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "email" TEXT,
  "workspaceId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "status" "WorkspaceInviteStatus" NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "acceptedByUserId" TEXT,

  CONSTRAINT "WorkspaceInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkspaceInvite_token_key" ON "WorkspaceInvite"("token");
CREATE INDEX "WorkspaceInvite_workspaceId_status_idx" ON "WorkspaceInvite"("workspaceId", "status");
CREATE INDEX "WorkspaceInvite_email_status_idx" ON "WorkspaceInvite"("email", "status");

ALTER TABLE "WorkspaceInvite"
ADD CONSTRAINT "WorkspaceInvite_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceInvite"
ADD CONSTRAINT "WorkspaceInvite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceInvite"
ADD CONSTRAINT "WorkspaceInvite_acceptedByUserId_fkey" FOREIGN KEY ("acceptedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
