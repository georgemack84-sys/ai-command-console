import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceViewer } from "@/src/server/auth/permissions";
import { NuruVaultPersistenceAdapter } from "@/src/server/repositories/nuru-vault-persistence-adapter";
export async function GET() { try { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceViewer({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); const events = (await new NuruVaultPersistenceAdapter(user.workspaceId).readVaultRecords()).filter((record): record is Extract<typeof record, { kind: "CODEX_EXECUTION_EVENT" }> => record.kind === "CODEX_EXECUTION_EVENT"); return apiSuccess({ events }); } catch (error) { return apiError(error, "Unable to load Codex execution events."); } }
