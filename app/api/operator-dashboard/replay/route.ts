import { NextResponse } from "next/server";
import { replayRequest, requireOperatorDashboardUser } from "../core";

export async function GET() { await requireOperatorDashboardUser(); return NextResponse.json(await replayRequest()); }
export async function POST(request: Request) { await requireOperatorDashboardUser(); return NextResponse.json(await replayRequest(request)); }
