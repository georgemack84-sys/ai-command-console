import { NextResponse } from "next/server";
import { reportingRequest, requireOperationalEvidenceReplayUser } from "../core";

export async function GET() { await requireOperationalEvidenceReplayUser(); return NextResponse.json(await reportingRequest()); }
export async function POST(request: Request) { await requireOperationalEvidenceReplayUser(); return NextResponse.json(await reportingRequest(request)); }
