import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireSyntheticIdentityDataGenerationUser, resultRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSyntheticIdentityDataGenerationUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run synthetic identity data generation."); } }
export async function POST(request: Request) { try { await requireSyntheticIdentityDataGenerationUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run synthetic identity data generation."); } }
