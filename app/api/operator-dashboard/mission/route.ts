import { NextResponse } from "next/server";
import { missionRequest, requireOperatorDashboardUser } from "../core";

export async function GET() { await requireOperatorDashboardUser(); return NextResponse.json(await missionRequest()); }
export async function POST(request: Request) { await requireOperatorDashboardUser(); return NextResponse.json(await missionRequest(request)); }
