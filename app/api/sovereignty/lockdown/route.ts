import { POST as containPost } from "@/app/api/sovereignty/contain/route";
import { apiSuccess } from "@/src/server/api/response";

export async function POST(request: Request) {
  const response = await containPost(request);
  const payload = await response.json();
  return apiSuccess({
    ...payload.data,
    previewAction: "LOCKDOWN",
  });
}
