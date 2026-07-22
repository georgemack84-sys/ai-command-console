import { NextResponse } from "next/server";
import { readinessRequest, requireMonitoringExperienceUser } from "../core";

export async function GET() { await requireMonitoringExperienceUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireMonitoringExperienceUser(); return NextResponse.json(await readinessRequest(request)); }
