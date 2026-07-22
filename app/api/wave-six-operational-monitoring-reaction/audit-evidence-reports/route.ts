import { NextResponse } from "next/server";
import { auditEvidenceReportsRequest, requireWaveSixOperationalMonitoringReactionUser } from "../core";

export async function GET() { await requireWaveSixOperationalMonitoringReactionUser(); return NextResponse.json(await auditEvidenceReportsRequest()); }
export async function POST(request: Request) { await requireWaveSixOperationalMonitoringReactionUser(); return NextResponse.json(await auditEvidenceReportsRequest(request)); }
