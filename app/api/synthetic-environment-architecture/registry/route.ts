import { apiError, apiSuccess } from "@/src/server/api/response";
import { registryRequest, requireSyntheticEnvironmentArchitectureUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSyntheticEnvironmentArchitectureUser(); return apiSuccess(await registryRequest()); } catch (error) { return apiError(error, "Unable to load synthetic environment registry."); } }
export async function POST(request: Request) { try { await requireSyntheticEnvironmentArchitectureUser(); return apiSuccess(await registryRequest(request)); } catch (error) { return apiError(error, "Unable to load synthetic environment registry."); } }
