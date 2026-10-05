import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireNuruGovernor } from "@/src/server/api/nuru-api";
import { getNuruOperations } from "@/src/server/services/nuru-observability-service";
export const dynamic = "force-dynamic";
export async function GET() { try { await requireNuruGovernor(); return apiSuccess(await getNuruOperations()); } catch (error) { return apiError(error, "Unable to load Nuru agent operations."); } }
