import { NextResponse } from "next/server";
import { operationalRequest, requireEcosystemReadinessUser } from "../core";
export async function GET() { await requireEcosystemReadinessUser(); return NextResponse.json(await operationalRequest()); }
export async function POST(request: Request) { await requireEcosystemReadinessUser(); return NextResponse.json(await operationalRequest(request)); }
