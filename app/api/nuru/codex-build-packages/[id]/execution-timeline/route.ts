import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceViewer } from "@/src/server/auth/permissions";
import { NuruVaultPersistenceAdapter } from "@/src/server/repositories/nuru-vault-persistence-adapter";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceViewer({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });

    const { id } = await context.params;
    const records = await new NuruVaultPersistenceAdapter(user.workspaceId).readVaultRecords();
    const events = records.flatMap((record) => {
      if (record.kind === "CODEX_EXECUTION_EVENT" && record.buildPackageId === id) {
        return [{ id: record.id, at: record.startedAt, type: "STARTED", detail: `Branch ${record.branch} · ${record.startedBy}` }];
      }
      if (record.kind === "CODEX_IMPLEMENTATION_LEDGER" && record.buildPackageId === id) {
        return [{ id: record.id, at: record.createdAt, type: record.qualificationStatus, detail: `${record.testsExecuted.length} tests · migration ${record.migrationStatus}` }];
      }
      return [];
    }).sort((left, right) => left.at.localeCompare(right.at));

    return apiSuccess({ events });
  } catch (error) {
    return apiError(error, "Unable to load the package execution timeline.");
  }
}
