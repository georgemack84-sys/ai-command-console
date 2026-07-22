import { NextResponse } from "next/server";
import { organizationRequest, requireOperationalIntelligenceUser } from "../core";

export async function GET() { await requireOperationalIntelligenceUser(); return NextResponse.json(await organizationRequest()); }
export async function POST(request: Request) { await requireOperationalIntelligenceUser(); return NextResponse.json(await organizationRequest(request)); }
