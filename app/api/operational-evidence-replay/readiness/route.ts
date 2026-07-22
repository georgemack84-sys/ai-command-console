import { NextResponse } from "next/server";
import { readinessRequest, requireOperationalEvidenceReplayUser } from "../core";

export async function GET() { await requireOperationalEvidenceReplayUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireOperationalEvidenceReplayUser(); return NextResponse.json(await readinessRequest(request)); }
