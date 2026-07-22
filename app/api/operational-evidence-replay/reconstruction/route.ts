import { NextResponse } from "next/server";
import { reconstructionRequest, requireOperationalEvidenceReplayUser } from "../core";

export async function GET() { await requireOperationalEvidenceReplayUser(); return NextResponse.json(await reconstructionRequest()); }
export async function POST(request: Request) { await requireOperationalEvidenceReplayUser(); return NextResponse.json(await reconstructionRequest(request)); }
