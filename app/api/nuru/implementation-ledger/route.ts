import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager, requireWorkspaceViewer } from "@/src/server/auth/permissions";
import { NuruVaultPersistenceAdapter } from "@/src/server/repositories/nuru-vault-persistence-adapter";
import { implementationLedgerInputSchema, NuruImplementationLedgerService } from "@/src/server/services/nuru-implementation-ledger-service";
import { enforceNsiWriteRateLimit } from "@/src/server/security/nsi-write-rate-limit";

const querySchema = z.object({ buildPackageId: z.string().trim().min(1).max(160).optional() });
async function viewer() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceViewer({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
export async function GET(request: Request) { try { const user = await viewer(); const query = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams)); return apiSuccess({ entries: await NuruImplementationLedgerService.list(query.buildPackageId, new NuruVaultPersistenceAdapter(user.workspaceId)) }); } catch (error) { return apiError(error, "Unable to load implementation evidence."); } }
export async function POST(request: Request) { try { const user = await viewer(); await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); await enforceNsiWriteRateLimit(request, { operation: "write", userId: user.id, workspaceId: user.workspaceId }); return apiSuccess({ entry: await NuruImplementationLedgerService.record(implementationLedgerInputSchema.parse(await request.json()), new NuruVaultPersistenceAdapter(user.workspaceId)) }, { status: 201 }); } catch (error) { return apiError(error, "Unable to record implementation evidence."); } }
