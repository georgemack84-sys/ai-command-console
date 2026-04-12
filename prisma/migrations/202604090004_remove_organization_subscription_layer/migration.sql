DROP TABLE IF EXISTS "Subscription";
DROP TABLE IF EXISTS "OrganizationMember";
ALTER TABLE "Workspace" DROP CONSTRAINT IF EXISTS "Workspace_organizationId_fkey";
ALTER TABLE "Workspace" DROP COLUMN IF EXISTS "organizationId";
DROP TABLE IF EXISTS "Organization";
DROP TYPE IF EXISTS "SubscriptionStatus";
DROP TYPE IF EXISTS "OrganizationMemberRole";
