import { NextResponse } from "next/server";
import { requireOperatorDashboardUser, riskRequest } from "../core";

export async function GET() { await requireOperatorDashboardUser(); return NextResponse.json(await riskRequest()); }
export async function POST(request: Request) { await requireOperatorDashboardUser(); return NextResponse.json(await riskRequest(request)); }
