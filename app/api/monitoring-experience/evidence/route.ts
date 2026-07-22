import { NextResponse } from "next/server";
import { evidenceRequest, requireMonitoringExperienceUser } from "../core";

export async function GET() { await requireMonitoringExperienceUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireMonitoringExperienceUser(); return NextResponse.json(await evidenceRequest(request)); }
