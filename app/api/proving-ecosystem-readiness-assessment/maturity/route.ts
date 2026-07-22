import { NextResponse } from "next/server";
import { maturityRequest, requireEcosystemReadinessUser } from "../core";
export async function GET() { await requireEcosystemReadinessUser(); return NextResponse.json(await maturityRequest()); }
export async function POST(request: Request) { await requireEcosystemReadinessUser(); return NextResponse.json(await maturityRequest(request)); }
