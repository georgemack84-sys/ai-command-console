import { apiError, apiSuccess } from "@/src/server/api/response";
import { originsRequest, requireSyntheticIdentityDataGenerationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSyntheticIdentityDataGenerationUser(); return apiSuccess(await originsRequest()); } catch (error) { return apiError(error, "Unable to load synthetic origins."); } }
export async function POST(request: Request) { try { await requireSyntheticIdentityDataGenerationUser(); return apiSuccess(await originsRequest(request)); } catch (error) { return apiError(error, "Unable to load synthetic origins."); } }
