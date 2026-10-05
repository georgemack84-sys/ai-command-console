import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireNuruGovernor } from "@/src/server/api/nuru-api";
import { NuruArchiveService } from "@/src/server/services/nuru-archive-service";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) { try { await requireNuruGovernor(); const { id } = await context.params; const item = await NuruArchiveService.retrieve(id); if (!item) throw new AppError(404, "not_found", "Nuru knowledge item not found."); return apiSuccess(item); } catch (error) { return apiError(error, "Unable to load Nuru knowledge."); } }
