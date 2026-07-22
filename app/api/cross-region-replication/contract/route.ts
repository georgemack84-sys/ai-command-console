import { contractResponse, requireCrossRegionReplicationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireCrossRegionReplicationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to read Cross Region Replication contract."); } }
