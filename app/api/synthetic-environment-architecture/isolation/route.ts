import { apiError, apiSuccess } from "@/src/server/api/response";
import { isolationRequest, requireSyntheticEnvironmentArchitectureUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSyntheticEnvironmentArchitectureUser(); return apiSuccess(await isolationRequest()); } catch (error) { return apiError(error, "Unable to load synthetic environment isolation."); } }
export async function POST(request: Request) { try { await requireSyntheticEnvironmentArchitectureUser(); return apiSuccess(await isolationRequest(request)); } catch (error) { return apiError(error, "Unable to load synthetic environment isolation."); } }
