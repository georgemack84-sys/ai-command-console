import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { NuruVaultPersistenceAdapter } from "@/src/server/repositories/nuru-vault-persistence-adapter";
import { NuruVaultReviewService, vaultApprovalSchema } from "@/src/server/services/nuru-vault-review-service";
import { enforceNsiWriteRateLimit } from "@/src/server/security/nsi-write-rate-limit";

async function manager() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
export async function GET() { try { const user = await manager(); const vault = new NuruVaultPersistenceAdapter(user.workspaceId); const [candidates, currentRecords] = await Promise.all([NuruVaultReviewService.list(vault), NuruVaultReviewService.listCurrentRecords(vault)]); return apiSuccess({ candidates, currentRecords }); } catch (error) { return apiError(error, "Unable to load the Nuru Vault review queue."); } }
export async function POST(request: Request) { try { const user = await manager(); await enforceNsiWriteRateLimit(request, { operation: "canonical-admission", userId: user.id, workspaceId: user.workspaceId }); const vault = new NuruVaultPersistenceAdapter(user.workspaceId); return apiSuccess(await NuruVaultReviewService.approve(vaultApprovalSchema.parse(await request.json()), { actor: `human:${user.id}`, correlationId: crypto.randomUUID() }, vault), { status: 201 }); } catch (error) { return apiError(error, "Unable to approve the Nuru Vault candidate."); } }
