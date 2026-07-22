import { NextResponse } from "next/server";
import { alertsRequest, requireOperatorDashboardUser } from "../core";

export async function GET() { await requireOperatorDashboardUser(); return NextResponse.json(await alertsRequest()); }
export async function POST(request: Request) { await requireOperatorDashboardUser(); return NextResponse.json(await alertsRequest(request)); }
