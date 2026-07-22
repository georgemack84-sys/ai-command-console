import { NextResponse } from "next/server";
import { dashboardRequest, requireMonitoringExperienceUser } from "../core";

export async function GET() { await requireMonitoringExperienceUser(); return NextResponse.json(await dashboardRequest()); }
export async function POST(request: Request) { await requireMonitoringExperienceUser(); return NextResponse.json(await dashboardRequest(request)); }
