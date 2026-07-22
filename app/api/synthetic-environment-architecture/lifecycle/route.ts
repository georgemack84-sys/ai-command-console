import { apiError, apiSuccess } from "@/src/server/api/response";
import { lifecycleRequest, requireSyntheticEnvironmentArchitectureUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSyntheticEnvironmentArchitectureUser(); return apiSuccess(await lifecycleRequest()); } catch (error) { return apiError(error, "Unable to load synthetic environment lifecycle."); } }
export async function POST(request: Request) { try { await requireSyntheticEnvironmentArchitectureUser(); return apiSuccess(await lifecycleRequest(request)); } catch (error) { return apiError(error, "Unable to load synthetic environment lifecycle."); } }
