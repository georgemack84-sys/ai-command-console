import { NextResponse } from "next/server";
import { requireOperationalEvidenceReplayUser, timelineRequest } from "../core";

export async function GET() { await requireOperationalEvidenceReplayUser(); return NextResponse.json(await timelineRequest()); }
export async function POST(request: Request) { await requireOperationalEvidenceReplayUser(); return NextResponse.json(await timelineRequest(request)); }
