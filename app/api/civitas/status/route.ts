import { NextResponse } from "next/server";
import { getCivitasStatus } from "@/lib/civitas/status";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getCivitasStatus(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
