import { NextResponse } from "next/server";
import { alertCenterRequest, requireMonitoringExperienceUser } from "../core";

export async function GET() { await requireMonitoringExperienceUser(); return NextResponse.json(await alertCenterRequest()); }
export async function POST(request: Request) { await requireMonitoringExperienceUser(); return NextResponse.json(await alertCenterRequest(request)); }
