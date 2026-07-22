import { NextResponse } from "next/server";
import { healthRequest, requireMonitoringExperienceUser } from "../core";

export async function GET() { await requireMonitoringExperienceUser(); return NextResponse.json(await healthRequest()); }
export async function POST(request: Request) { await requireMonitoringExperienceUser(); return NextResponse.json(await healthRequest(request)); }
