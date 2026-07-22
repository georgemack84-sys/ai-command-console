import { NextResponse } from "next/server";
import { readinessRequest, requireOperationalIntelligenceUser } from "../core";

export async function GET() { await requireOperationalIntelligenceUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireOperationalIntelligenceUser(); return NextResponse.json(await readinessRequest(request)); }
