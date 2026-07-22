import { NextResponse } from "next/server";
import { requireMonitoringExperienceUser, slaRequest } from "../core";

export async function GET() { await requireMonitoringExperienceUser(); return NextResponse.json(await slaRequest()); }
export async function POST(request: Request) { await requireMonitoringExperienceUser(); return NextResponse.json(await slaRequest(request)); }
