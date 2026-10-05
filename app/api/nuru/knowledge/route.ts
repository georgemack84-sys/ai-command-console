import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireNuruGovernor } from "@/src/server/api/nuru-api";
import { NuruSearchService, nuruSearchSchema } from "@/src/server/services/nuru-search-service";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireNuruGovernor(); const q = new URL(request.url).searchParams; const statuses = q.get("status")?.split(",").map((value) => value.trim()).filter(Boolean); return apiSuccess(await NuruSearchService.search(nuruSearchSchema.parse({ query: q.get("query") ?? undefined, project: q.get("project") ?? undefined, type: q.get("type") ?? undefined, ...(statuses?.length ? { statuses } : {}), ...(q.get("limit") ? { limit: Number(q.get("limit")) } : {}), metadata: {} }))); } catch (error) { return apiError(error, "Unable to load Nuru knowledge."); } }
