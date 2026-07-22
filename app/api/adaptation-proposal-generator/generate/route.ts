import { apiError, apiSuccess } from "@/src/server/api/response";
import { generateRequest, requireAdaptationProposalGeneratorUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptationProposalGeneratorUser();
    return apiSuccess(await generateRequest(request));
  } catch (error) {
    return apiError(error, "Unable to generate adaptation proposals.");
  }
}
