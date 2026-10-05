import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireNuruGovernor } from "@/src/server/api/nuru-api";
import { NuruAuditService } from "@/src/server/services/nuru-audit-service";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireNuruGovernor(); const resourceId = new URL(request.url).searchParams.get("resourceId"); if (!resourceId) return apiSuccess([]); return apiSuccess(await NuruAuditService.history(resourceId)); } catch (error) { return apiError(error, "Unable to load Nuru audit events."); } }
