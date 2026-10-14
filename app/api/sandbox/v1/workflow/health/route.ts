import { apiSuccess } from "@/src/server/api/response";

/** Public, non-sensitive evidence that this endpoint is the built-in sandbox. */
export async function GET() {
  return apiSuccess({
    contract: "proprium.workflow-sandbox",
    version: "1",
    mode: "local-sandbox",
    publishesExternally: false,
    operations: ["evidence.retrieve", "headline.draft"],
  });
}
