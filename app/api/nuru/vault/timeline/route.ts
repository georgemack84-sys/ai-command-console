import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceViewer } from "@/src/server/auth/permissions";
import { NuruVaultPersistenceAdapter } from "@/src/server/repositories/nuru-vault-persistence-adapter";
import { NuruVaultTimelineService } from "@/src/server/services/nuru-vault-timeline-service";

const querySchema = z.object({ correlationId: z.string().trim().min(1).max(160).optional(), classification: z.string().trim().min(1).max(32).optional(), eventType: z.string().trim().min(1).max(80).optional(), sourceId: z.string().trim().min(1).max(160).optional() });
export async function GET(request: Request) { try { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceViewer({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); const query = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams)); return apiSuccess({ events: await NuruVaultTimelineService.search(query, new NuruVaultPersistenceAdapter(user.workspaceId)) }); } catch (error) { return apiError(error, "Unable to search the Nuru Vault timeline."); } }
