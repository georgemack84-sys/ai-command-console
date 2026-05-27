import { GET as baseGet } from "../status/route";

export async function GET(request: Request) {
  return baseGet(request);
}
