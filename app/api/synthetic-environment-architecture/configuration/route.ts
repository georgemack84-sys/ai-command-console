import { apiError, apiSuccess } from "@/src/server/api/response";
import { configurationRequest, requireSyntheticEnvironmentArchitectureUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSyntheticEnvironmentArchitectureUser(); return apiSuccess(await configurationRequest()); } catch (error) { return apiError(error, "Unable to load synthetic environment configuration."); } }
export async function POST(request: Request) { try { await requireSyntheticEnvironmentArchitectureUser(); return apiSuccess(await configurationRequest(request)); } catch (error) { return apiError(error, "Unable to load synthetic environment configuration."); } }
