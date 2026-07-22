import { NextResponse } from "next/server";
import { requireOperationalEvidenceReplayUser, stateRequest } from "../core";

export async function GET() { await requireOperationalEvidenceReplayUser(); return NextResponse.json(await stateRequest()); }
export async function POST(request: Request) { await requireOperationalEvidenceReplayUser(); return NextResponse.json(await stateRequest(request)); }
