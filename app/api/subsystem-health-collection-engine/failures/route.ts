import { failuresRequest, requireSubsystemHealthCollectionUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireSubsystemHealthCollectionUser();
    return apiSuccess(await failuresRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load subsystem health failures.");
  }
}
