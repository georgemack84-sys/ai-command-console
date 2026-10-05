import { requireSessionUser } from "@/src/lib/auth";
import { getWorkspaceSettingsSnapshot } from "@/src/server/services/workspace-service";
import { WorkspaceSettingsClient } from "@/src/components/settings/workspace-settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireSessionUser();
  const snapshot = await getWorkspaceSettingsSnapshot(user.id, user.workspaceId);

  return <WorkspaceSettingsClient {...snapshot} />;
}
