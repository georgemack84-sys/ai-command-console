import { NextResponse } from "next/server";
import { ecosystemRequest, requireEcosystemReadinessUser } from "../core";
export async function GET() { await requireEcosystemReadinessUser(); return NextResponse.json(await ecosystemRequest()); }
export async function POST(request: Request) { await requireEcosystemReadinessUser(); return NextResponse.json(await ecosystemRequest(request)); }
