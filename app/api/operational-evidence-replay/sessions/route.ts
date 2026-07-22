import { NextResponse } from "next/server";
import { requireOperationalEvidenceReplayUser, sessionsRequest } from "../core";

export async function GET() { await requireOperationalEvidenceReplayUser(); return NextResponse.json(await sessionsRequest()); }
export async function POST(request: Request) { await requireOperationalEvidenceReplayUser(); return NextResponse.json(await sessionsRequest(request)); }
