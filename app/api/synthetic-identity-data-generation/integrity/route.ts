import { apiError, apiSuccess } from "@/src/server/api/response";
import { integrityRequest, requireSyntheticIdentityDataGenerationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSyntheticIdentityDataGenerationUser(); return apiSuccess(await integrityRequest()); } catch (error) { return apiError(error, "Unable to load synthetic integrity records."); } }
export async function POST(request: Request) { try { await requireSyntheticIdentityDataGenerationUser(); return apiSuccess(await integrityRequest(request)); } catch (error) { return apiError(error, "Unable to load synthetic integrity records."); } }
