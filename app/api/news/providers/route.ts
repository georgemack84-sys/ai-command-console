import { NextResponse } from "next/server";
import { cacheStats } from "@/lib/news/cache";
import { getProviderHealth } from "@/lib/news/providers";

export const dynamic = "force-dynamic";

export async function GET() {
  const providers = await getProviderHealth();
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    providers,
    cache: cacheStats(),
  });
}
