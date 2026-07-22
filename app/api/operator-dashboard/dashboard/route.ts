import { NextResponse } from "next/server";
import { dashboardRequest, requireOperatorDashboardUser } from "../core";

export async function GET() { await requireOperatorDashboardUser(); return NextResponse.json(await dashboardRequest()); }
export async function POST(request: Request) { await requireOperatorDashboardUser(); return NextResponse.json(await dashboardRequest(request)); }
