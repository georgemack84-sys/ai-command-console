import { POST as basePost } from "../../resilience/stabilize/route";

export async function POST(request: Request) {
  return basePost(request);
}
