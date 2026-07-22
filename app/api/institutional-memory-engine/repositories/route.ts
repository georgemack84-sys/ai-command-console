import { apiError, apiSuccess } from "@/src/server/api/response";
import { repositoriesRequest, requireInstitutionalMemoryUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireInstitutionalMemoryUser();
    return apiSuccess(await repositoriesRequest());
  } catch (error) {
    return apiError(error, "Unable to retrieve institutional memory repositories.");
  }
}

export async function POST(request: Request) {
  try {
    await requireInstitutionalMemoryUser();
    return apiSuccess(await repositoriesRequest(request));
  } catch (error) {
    return apiError(error, "Unable to query institutional memory repositories.");
  }
}
