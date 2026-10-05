import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireNuruGovernor } from "@/src/server/api/nuru-api";
import { NuruCurationQueueService } from "@/src/server/services/nuru-curation-queue-service";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireNuruGovernor(); const status = new URL(request.url).searchParams.get("status") ?? undefined; return apiSuccess(await NuruCurationQueueService.list(status as never)); } catch (error) { return apiError(error, "Unable to load the curation queue."); } }
